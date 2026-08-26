#!/usr/bin/env node
/**
 * svg-migrate.cjs
 *
 * Single-file SVG migration pipeline for the Edge Delivery bulk import.
 * Consolidates the audit / download / verify / clean steps behind subcommands.
 *
 * Subcommands:
 *   audit     Survey asset-mapping*.json, build svg-inventory.json, flag collisions.
 *   download  Download every inventoried SVG into /icons (skips existing, sanitizes).
 *   verify    Cross-check inventory against /icons; fail if any icon is missing/invalid.
 *   clean     Strip successfully-migrated .svg entries from mappings + lowercase DAM paths.
 *   all       Chains audit -> download -> verify. Stops BEFORE clean deliberately -
 *             /icons must be committed and deployed before mapping files are cleaned
 *             and the bulk aem-upload is run (see AEM Upload.md, deploy ordering hazard).
 *
 * Recommended flow:
 *   node tools/importer/svg/svg-migrate.cjs all "C:\...\asset-mapping.json" --insecure
 *   # review output, commit /icons, DEPLOY
 *   node tools/importer/svg/svg-migrate.cjs clean "C:\...\asset-mapping.json" [--dry-run]
 *
 * Usage per command:
 *   audit    <mapping-file-or-dir...> [--out <file>] [--allow-collisions]
 *   download [--inventory <file>] [--icons-dir <dir>] [--results-out <file>] [--insecure] [--force]
 *   verify   [--inventory <file>] [--icons-dir <dir>]
 *   clean    <mapping-file-or-dir...> [--results <file>] [--dry-run]
 *   all      <mapping-file-or-dir...> [--out <file>] [--icons-dir <dir>] [--results-out <file>]
 *            [--allow-collisions] [--insecure] [--force]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');

const INVENTORY_FILE = path.join(__dirname, 'svg-inventory.json');
const ICONS_DIR = path.join(__dirname, '..', '..', '..', 'icons');
const RESULTS_FILE = path.join(__dirname, 'svg-download-results.json');
const REQUEST_TIMEOUT_MS = 20000;
const MAX_REDIRECTS = 5;

/* ------------------------------------------------------------------ *
 * Shared helpers
 * ------------------------------------------------------------------ */

// Fails fast with a clear message instead of silently assigning `undefined` to a flag.
function requireValue(argv, i, flag) {
  const value = argv[i + 1];
  if (value === undefined || value.startsWith('--')) {
    console.error(`Missing value for ${flag}`);
    process.exit(1);
  }
  return value;
}

// Recursively resolve inputs (files or directories) to concrete asset-mapping*.json paths.
function resolveMappingFiles(inputs) {
  const results = [];
  const walk = (p) => {
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      fs.readdirSync(p).forEach((entry) => walk(path.join(p, entry)));
    } else if (/asset-mapping.*\.json$/i.test(path.basename(p))) {
      results.push(p);
    }
  };
  inputs.forEach((input) => {
    if (!fs.existsSync(input)) {
      console.warn(`Skipping missing path: ${input}`);
      return;
    }
    walk(input);
  });
  return results;
}

// Derive a lowercase, kebab-case icon slug from a source URL's filename.
function slugify(sourceUrl) {
  const base = path.basename(new URL(sourceUrl).pathname, path.extname(sourceUrl));
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Existing /icons filenames may use hyphens or underscores - match either convention
// before deciding a slug is genuinely missing (avoids false "missing"/re-download).
function makeExistingFinder(iconsDir) {
  const existingFiles = fs.existsSync(iconsDir) ? fs.readdirSync(iconsDir) : [];
  const normalize = (name) => name.toLowerCase().replace(/[-_]/g, '');
  return (slug) => {
    const target = normalize(slug);
    const match = existingFiles.find(
      (f) => f.toLowerCase().endsWith('.svg') && normalize(path.basename(f, '.svg')) === target,
    );
    return match ? path.join(iconsDir, match) : null;
  };
}

/* ------------------------------------------------------------------ *
 * audit (core logic returns a result object so `all` can reuse it)
 * ------------------------------------------------------------------ */

function runAudit({ files, out, allowCollisions }) {
  const mappingFiles = resolveMappingFiles(files);
  if (!mappingFiles.length) {
    console.error('No asset-mapping*.json files found in the given paths.');
    process.exit(1);
  }

  const bySlug = new Map();

  mappingFiles.forEach((mappingFile) => {
    let mapping;
    try {
      mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
    } catch (err) {
      console.warn(`Skipping unreadable/invalid JSON: ${mappingFile} (${err.message})`);
      return;
    }

    Object.keys(mapping).forEach((sourceUrl) => {
      if (!/\.svg$/i.test(sourceUrl)) return;

      let slug;
      try {
        slug = slugify(sourceUrl);
      } catch (err) {
        console.warn(`Skipping unparsable URL "${sourceUrl}" in ${mappingFile}: ${err.message}`);
        return;
      }

      if (!bySlug.has(slug)) {
        bySlug.set(slug, {
          slug, urls: new Set(), sourceFiles: new Set(), occurrences: 0,
        });
      }
      const entry = bySlug.get(slug);
      entry.urls.add(sourceUrl);
      entry.sourceFiles.add(mappingFile);
      entry.occurrences += 1;
    });
  });

  const inventory = [];
  const collisions = [];

  bySlug.forEach((entry) => {
    const urls = [...entry.urls];
    if (urls.length > 1) collisions.push({ slug: entry.slug, urls });
    inventory.push({
      slug: entry.slug,
      url: urls[0], // primary URL to download from; collisions must be resolved first
      allUrls: urls,
      occurrences: entry.occurrences,
      sourceFiles: [...entry.sourceFiles],
    });
  });

  const output = {
    generatedAt: new Date().toISOString(),
    mappingFilesScanned: mappingFiles.length,
    uniqueSvgCount: inventory.length,
    collisionCount: collisions.length,
    collisions,
    inventory,
  };

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(output, null, 2));

  console.log(`Scanned ${mappingFiles.length} mapping file(s).`);
  console.log(`Found ${inventory.length} unique SVG slug(s).`);
  console.log(`Inventory written to ${out}`);

  if (collisions.length) {
    console.error(`\n${collisions.length} basename collision(s) detected - different source URLs would overwrite the same /icons file:`);
    collisions.forEach((c) => {
      console.error(`  - "${c.slug}":`);
      c.urls.forEach((u) => console.error(`      ${u}`));
    });
    if (!allowCollisions) {
      console.error('\nResolve collisions (rename slugs in the inventory file) before running download.');
      console.error('Re-run with --allow-collisions to proceed anyway (NOT recommended).');
      return { ok: false, output };
    }
  }
  return { ok: true, output };
}

function cmdAudit(argv) {
  const args = { files: [], out: INVENTORY_FILE, allowCollisions: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--out') { args.out = requireValue(argv, i, arg); i += 1; } else if (arg === '--allow-collisions') { args.allowCollisions = true; } else { args.files.push(arg); }
  }
  if (!args.files.length) {
    console.error('Usage: svg-migrate.cjs audit <mapping-file-or-dir...> [--out <file>] [--allow-collisions]');
    process.exit(1);
  }
  const { ok } = runAudit(args);
  if (!ok) process.exit(1);
}

/* ------------------------------------------------------------------ *
 * download
 * ------------------------------------------------------------------ */

function sanitizeSvg(svgText) {
  return svgText
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '')
    .replace(/(xlink:href|href)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"');
}

// A malformed/empty response would otherwise look like SVG content that decoded to nothing.
function looksLikeSvg(text) {
  return text.slice(0, 1000).toLowerCase().includes('<svg');
}

function download(url, insecure, redirectsLeft = MAX_REDIRECTS) {
  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch (err) {
      reject(new Error(`Invalid URL: ${url}`));
      return;
    }
    const client = parsed.protocol === 'http:' ? http : https;
    const agent = (client === https && insecure) ? new https.Agent({ rejectUnauthorized: false }) : undefined;
    // Some sites (e.g. kotaklife.com) return 403 for requests with no browser-like User-Agent
    const headersOut = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      Accept: 'image/svg+xml,*/*',
    };

    const req = client.get(url, { agent, headers: headersOut }, (res) => {
      const { statusCode, headers } = res;

      if ([301, 302, 303, 307, 308].includes(statusCode)) {
        res.resume();
        if (redirectsLeft <= 0) {
          reject(new Error(`Too many redirects (last: ${url})`));
          return;
        }
        if (!headers.location) {
          reject(new Error(`HTTP ${statusCode} with no Location header`));
          return;
        }
        resolve(download(new URL(headers.location, url).href, insecure, redirectsLeft - 1));
        return;
      }

      if (statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${statusCode}`));
        return;
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        const contentType = (headers['content-type'] || '').toLowerCase();
        // A 200 status with an HTML error page body would otherwise be written as a valid .svg
        if (contentType.includes('html') || !looksLikeSvg(body)) {
          reject(new Error(`Response is not an SVG (content-type: ${contentType || 'unknown'})`));
          return;
        }
        resolve(body);
      });
      res.on('error', reject);
    });

    req.on('error', reject);
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy(new Error(`Timeout after ${REQUEST_TIMEOUT_MS}ms`));
    });
  });
}

async function runDownload({
  inventory: inventoryPath, iconsDir, resultsOut, insecure, force,
}) {
  if (!fs.existsSync(inventoryPath)) {
    console.error(`Inventory file not found: ${inventoryPath}`);
    console.error('Run the audit command first.');
    return { ok: false };
  }

  const { inventory, collisionCount } = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
  if (collisionCount > 0) {
    console.error(`Inventory has ${collisionCount} unresolved slug collision(s). Fix these before downloading.`);
    return { ok: false };
  }

  fs.mkdirSync(iconsDir, { recursive: true });

  const results = [];
  const seenHashes = new Map(); // sha256 -> slug (detect duplicate content across slugs)
  const findExisting = makeExistingFinder(iconsDir);

  // eslint-disable-next-line no-restricted-syntax
  for (const item of inventory) {
    const destPath = path.join(iconsDir, `${item.slug}.svg`);
    const existingMatch = findExisting(item.slug);

    if (!force && existingMatch) {
      results.push({
        slug: item.slug, url: item.url, status: 'skipped-existing', file: existingMatch,
      });
      // eslint-disable-next-line no-continue
      continue;
    }

    try {
      // eslint-disable-next-line no-await-in-loop
      const raw = await download(item.url, insecure);
      const clean = sanitizeSvg(raw);
      const hash = crypto.createHash('sha256').update(clean).digest('hex');

      if (seenHashes.has(hash) && seenHashes.get(hash) !== item.slug) {
        console.warn(`Note: "${item.slug}" has identical content to "${seenHashes.get(hash)}" - consider consolidating.`);
      }
      seenHashes.set(hash, item.slug);

      fs.writeFileSync(destPath, clean, 'utf8');
      // Catch truncated/zero-byte writes (disk full, interrupted process) immediately, not later.
      if (fs.statSync(destPath).size === 0) throw new Error('Wrote 0 bytes to disk');

      results.push({
        slug: item.slug, url: item.url, status: 'downloaded', file: destPath,
      });
      console.log(`Downloaded: ${item.slug}.svg`);
    } catch (err) {
      results.push({
        slug: item.slug, url: item.url, status: 'failed', error: err.message,
      });
      console.error(`Failed: ${item.slug} (${item.url}) - ${err.message}`);
    }
  }

  fs.writeFileSync(resultsOut, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));

  const downloaded = results.filter((r) => r.status === 'downloaded').length;
  const skipped = results.filter((r) => r.status === 'skipped-existing').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  console.log(`\nDownloaded: ${downloaded}, Skipped (already present): ${skipped}, Failed: ${failed}`);
  console.log(`Results written to ${resultsOut}`);

  if (failed > 0) {
    console.error('\nSome downloads failed - their .svg entries must NOT be removed from asset-mapping.json (see the clean command).');
    return { ok: false, failed };
  }
  return { ok: true, failed: 0 };
}

async function cmdDownload(argv) {
  const args = {
    inventory: INVENTORY_FILE, iconsDir: ICONS_DIR, resultsOut: RESULTS_FILE, insecure: false, force: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--inventory') { args.inventory = requireValue(argv, i, arg); i += 1; } else if (arg === '--icons-dir') { args.iconsDir = requireValue(argv, i, arg); i += 1; } else if (arg === '--results-out') { args.resultsOut = requireValue(argv, i, arg); i += 1; } else if (arg === '--insecure') { args.insecure = true; } else if (arg === '--force') { args.force = true; } else { console.error(`Unknown argument: ${arg}`); process.exit(1); }
  }
  const { ok } = await runDownload(args);
  if (!ok) process.exitCode = 1;
}

/* ------------------------------------------------------------------ *
 * verify
 * ------------------------------------------------------------------ */

function runVerify({ inventory: inventoryPath, iconsDir }) {
  if (!fs.existsSync(inventoryPath)) {
    console.error(`Inventory file not found: ${inventoryPath}`);
    console.error('Run the audit command first.');
    return { ok: false };
  }
  if (!fs.existsSync(iconsDir)) {
    console.error(`Icons directory not found: ${iconsDir}`);
    return { ok: false };
  }

  const { inventory } = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
  const problems = [];
  const findExisting = makeExistingFinder(iconsDir);

  inventory.forEach(({ slug, occurrences }) => {
    const file = findExisting(slug);

    if (!file) {
      problems.push(`MISSING: ${slug}.svg (referenced ${occurrences} time(s) in mapping files)`);
      return;
    }

    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch (err) {
      problems.push(`UNREADABLE: ${slug}.svg (${err.message})`);
      return;
    }

    if (!content.trim()) {
      problems.push(`EMPTY: ${slug}.svg`);
    } else if (!content.toLowerCase().includes('<svg')) {
      problems.push(`NOT AN SVG: ${slug}.svg (no <svg> tag found - may be an HTML error page)`);
    }
  });

  if (problems.length) {
    console.error(`${problems.length} icon problem(s) found in ${iconsDir}:`);
    problems.forEach((p) => console.error(`  - ${p}`));
    console.error('\nDo NOT deploy or run the clean command until these are resolved.');
    return { ok: false };
  }

  console.log(`All ${inventory.length} icon(s) verified present and valid in ${iconsDir}`);
  return { ok: true };
}

function cmdVerify(argv) {
  const args = { inventory: INVENTORY_FILE, iconsDir: ICONS_DIR };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--inventory') { args.inventory = requireValue(argv, i, arg); i += 1; } else if (arg === '--icons-dir') { args.iconsDir = requireValue(argv, i, arg); i += 1; } else { console.error(`Unknown argument: ${arg}`); process.exit(1); }
  }
  const { ok } = runVerify(args);
  if (!ok) process.exit(1);
}

/* ------------------------------------------------------------------ *
 * clean
 * ------------------------------------------------------------------ */

function cmdClean(argv) {
  const args = { files: [], results: RESULTS_FILE, dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--results') { args.results = requireValue(argv, i, arg); i += 1; } else if (arg === '--dry-run') { args.dryRun = true; } else { args.files.push(arg); }
  }

  if (!args.files.length) {
    console.error('Usage: svg-migrate.cjs clean <mapping-file-or-dir...> [--results <file>] [--dry-run]');
    process.exit(1);
  }
  if (!fs.existsSync(args.results)) {
    console.error(`Download results file not found: ${args.results}`);
    console.error('Run the download command first.');
    process.exit(1);
  }

  const { results } = JSON.parse(fs.readFileSync(args.results, 'utf8'));
  // A URL is safe to strip only if its download succeeded (freshly downloaded or already present).
  const succeededUrls = new Set(
    results.filter((r) => r.status === 'downloaded' || r.status === 'skipped-existing').map((r) => r.url),
  );
  const failedUrls = new Set(results.filter((r) => r.status === 'failed').map((r) => r.url));

  const mappingFiles = resolveMappingFiles(args.files);
  if (!mappingFiles.length) {
    console.error('No asset-mapping*.json files found in the given paths.');
    process.exit(1);
  }

  let totalRemoved = 0;
  let totalKeptFailed = 0;
  let totalLowercased = 0;

  mappingFiles.forEach((mappingFile) => {
    let mapping;
    try {
      mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
    } catch (err) {
      console.warn(`Skipping unreadable/invalid JSON: ${mappingFile} (${err.message})`);
      return;
    }

    const cleaned = {};
    Object.entries(mapping).forEach(([sourceUrl, damPath]) => {
      if (/\.svg$/i.test(sourceUrl)) {
        if (succeededUrls.has(sourceUrl)) {
          totalRemoved += 1;
          return; // drop - now served via /icons + :slug: shorthand
        }
        if (failedUrls.has(sourceUrl)) {
          console.warn(`Keeping failed SVG entry (download did not succeed): ${sourceUrl}`);
          totalKeptFailed += 1;
          cleaned[sourceUrl] = damPath;
          return;
        }
        // SVG present in mapping but never seen in download results - keep, don't guess.
        console.warn(`Keeping unrecognized SVG entry (not in download results): ${sourceUrl}`);
        cleaned[sourceUrl] = damPath;
        return;
      }

      const lowered = typeof damPath === 'string' ? damPath.toLowerCase() : damPath;
      if (lowered !== damPath) totalLowercased += 1;
      cleaned[sourceUrl] = lowered;
    });

    if (!args.dryRun) {
      fs.writeFileSync(mappingFile, JSON.stringify(cleaned, null, 2));
    }
    console.log(`${args.dryRun ? '[dry-run] ' : ''}Updated ${mappingFile}`);
  });

  console.log(`\nSVG entries removed: ${totalRemoved}`);
  console.log(`SVG entries kept (failed/unresolved download): ${totalKeptFailed}`);
  console.log(`DAM paths lowercased: ${totalLowercased}`);
  if (args.dryRun) console.log('\nDry run - no files were modified.');
}

/* ------------------------------------------------------------------ *
 * all - chains audit -> download -> verify. Stops before clean on purpose:
 * /icons must be committed + deployed before mapping files are cleaned and
 * the bulk aem-upload runs (deploy-ordering hazard - see AEM Upload.md).
 * ------------------------------------------------------------------ */

async function cmdAll(argv) {
  const args = {
    files: [],
    out: INVENTORY_FILE,
    iconsDir: ICONS_DIR,
    resultsOut: RESULTS_FILE,
    allowCollisions: false,
    insecure: false,
    force: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--out') { args.out = requireValue(argv, i, arg); i += 1; } else if (arg === '--icons-dir') { args.iconsDir = requireValue(argv, i, arg); i += 1; } else if (arg === '--results-out') { args.resultsOut = requireValue(argv, i, arg); i += 1; } else if (arg === '--allow-collisions') { args.allowCollisions = true; } else if (arg === '--insecure') { args.insecure = true; } else if (arg === '--force') { args.force = true; } else { args.files.push(arg); }
  }
  if (!args.files.length) {
    console.error('Usage: svg-migrate.cjs all <mapping-file-or-dir...> [--insecure] [--force] [--allow-collisions]');
    process.exit(1);
  }

  console.log('=== Step 1/3: audit ===');
  const auditResult = runAudit({ files: args.files, out: args.out, allowCollisions: args.allowCollisions });
  if (!auditResult.ok) {
    console.error('\nStopping: unresolved collisions. Fix and re-run.');
    process.exit(1);
  }

  console.log('\n=== Step 2/3: download ===');
  const downloadResult = await runDownload({
    inventory: args.out, iconsDir: args.iconsDir, resultsOut: args.resultsOut, insecure: args.insecure, force: args.force,
  });
  if (!downloadResult.ok) {
    console.error(`\nStopping: ${downloadResult.failed || 'some'} download(s) failed. Resolve before verifying.`);
    process.exit(1);
  }

  console.log('\n=== Step 3/3: verify ===');
  const verifyResult = runVerify({ inventory: args.out, iconsDir: args.iconsDir });
  if (!verifyResult.ok) {
    console.error('\nStopping: verification failed.');
    process.exit(1);
  }

  console.log('\nAll steps passed. Next: commit + deploy /icons, THEN run the clean command.');
}

/* ------------------------------------------------------------------ *
 * dispatch
 * ------------------------------------------------------------------ */

function printUsage() {
  console.log('Usage: node tools/importer/svg/svg-migrate.cjs <audit|download|verify|clean|all> [options]');
  console.log('\nRecommended: run "all" first, then deploy /icons, then run "clean".');
  console.log('\n  audit    <mapping-file-or-dir...> [--out <file>] [--allow-collisions]');
  console.log('  download [--inventory <file>] [--icons-dir <dir>] [--results-out <file>] [--insecure] [--force]');
  console.log('  verify   [--inventory <file>] [--icons-dir <dir>]');
  console.log('  clean    <mapping-file-or-dir...> [--results <file>] [--dry-run]');
  console.log('  all      <mapping-file-or-dir...> [--insecure] [--force] [--allow-collisions]  (audit+download+verify)');
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  switch (command) {
    case 'audit': cmdAudit(rest); break;
    case 'download': await cmdDownload(rest); break;
    case 'verify': cmdVerify(rest); break;
    case 'clean': cmdClean(rest); break;
    case 'all': await cmdAll(rest); break;
    case undefined:
    case '--help':
    case '-h':
      printUsage();
      break;
    default:
      console.error(`Unknown command: ${command}\n`);
      printUsage();
      process.exit(1);
  }
}

main();

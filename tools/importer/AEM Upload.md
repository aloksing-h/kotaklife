# AEM Import Helper Reference Guide

This document outlines the setup, execution, and debugging steps for uploading migrated ZIP packages and mapping external assets to AEM using the `@adobe/aem-import-helper` tool.

---

## 1. Project Setup

Before running the upload command, ensure your local environment is configured correctly.

### Install the Helper

Ensure the tool is installed in your project as a development dependency:

```bash
npm install @adobe/aem-import-helper --save-dev
```

### Configure package.json

Your `package.json` must include the alias to trigger the tool. Add the following line to your `"scripts"` block:

```json
"aem-upload": "aem-import-helper aem upload"
```

### Configure Authentication Token

Save your active AEM Developer Console token inside a file named `token.txt` in your project's root directory.

> **Note:** AEM Local Development tokens expire every 24 hours. You will need to rotate this token daily.

---

## 2. Execution Command

Run the following command in your Git Bash terminal to upload your zip file and download/map the corresponding assets. Ensure you replace the file paths and target URL with your actual environment details.

```bash
npm run aem-upload -- --token token.txt --zip "C:\Users\Mahesh.kamble\Downloads\protection\kotak-life_what-are-insurance-riders-and-how-to-choose-them-in-a-term-plan.zip" --asset-mapping "C:\Users\Mahesh.kamble\Downloads\protection\asset-mapping.json" --target https://author-pXXXXX-eYYYYYY.adobeaemcloud.com
```

> **Tip:** The double dashes (`--`) before `--token` are required to pass arguments from npm directly to the underlying script.

---

## 3. Troubleshooting & Debugging Guide

If the process fails or hangs, identify the symptom below to apply the correct fix.

### SSL certificate problem: self signed certificate

- **Root Cause:** Corporate firewalls/proxies intercepting Node.js traffic to inject their own SSL certs.
- **Solution:** Run the following in your terminal before running the upload command:

```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

### 405 - Method Not Allowed

- **Root Cause:** The `--target` URL incorrectly includes UI paths.
- **Solution:** Remove the UI path. Use only the base environment URL (e.g., `https://author-p123-e456.adobeaemcloud.com`).

### 401 Unauthorized

- **Root Cause:** The local development token has expired.
- **Solution:** Generate a new token via **Cloud Manager > Developer Console > Integrations > Local Token**.

### Asset Path Mismatches / 0 files uploaded

- **Root Cause:** AEM paths are strictly case-sensitive and must be lowercase.
- **Solution:** Ensure your Asset Import Path and JSON use strictly lowercase naming (e.g., `/content/dam/assets-kotak`).

### Missing script: "aem-upload"

- **Root Cause:** Node cannot find the command alias in `package.json`.
- **Solution:** Verify you are in the correct root directory and that you saved the `package.json` file.

---

## 4. SVG Handling Strategy for Bulk Migration (1,200 pages) (Optional For now)

### Decision: Extension-only (no size/content classification)

Every `.svg` file found in `asset-mapping.json` is treated identically, regardless of size or content:

1. Downloaded into `/icons` (dedup by content hash, lowercase kebab-case filename).
2. Referenced via `:slug:` shorthand in the importer output (replacing the `<img>` tag).
3. Removed from `asset-mapping.json` entirely — no DAM upload for any SVG.

There is no PNG-conversion/RASTER track and no dimension or `<text>`/`<filter>` inspection gate. This is simpler to implement and fully bypasses `html2md` image validation and the `409 Conflict` risk for every SVG uniformly.

### Accepted risk (explicit tradeoff, not an oversight)

- `.icon { height:24px; width:24px }` in `styles.css` applies to **every** migrated SVG, including any that were previously large illustrations/infographics/diagrams rendered at full content width. These will render squashed to 24×24 post-migration unless a per-block/per-instance CSS override is added manually afterward.
- `aem.js` `decorateIcon` hardcodes `alt=""` for every icon-routed SVG — any SVG that previously carried meaningful alt text (badges, ratings, logos) loses it.
- **Mitigation (manual, post-hoc, not part of the automated pipeline):** after the bulk run, visually spot-check pages for squashed graphics and patch block CSS / re-add alt text case-by-case where flagged.

### Edge cases to handle explicitly

1. **Importer has no filesystem access.** `importv3.js` runs in-browser via the Helix Importer UI and cannot `require()` an audit JSON at transform time. Resolve via one of: codegen a literal `SVG_MAP` (slug lookup) into the importer with a checksum guard; fetch the map over HTTP (CORS risk); or derive the slug purely from the URL/filename at runtime, no per-file map needed.
2. **Silent invisible icons.** `decorateIcons` only runs where explicitly invoked (`scripts.js` section/main decoration, `search.js`). `modal.js` injects `span.icon.icon-close` without calling `decorateIcons` — verify it renders. Any icon added after section decoration silently becomes an empty 24×24 box with no console error.
3. **`alt=""` is hardcoded.** `aem.js` `decorateIcon` never accepts alt text — all icons become decorative-only. See "Accepted risk" above.
4. **`<img>`-loaded SVG is sandboxed.** No `currentColor` inheritance, no external font loading for embedded `<text>`, no CSS custom properties crossing the boundary. Any SVG relying on page-level tinting or embedded webfonts will render incorrectly once moved to the icon track.
5. **Deploy ordering hazard.** Icons ship via code deploy; pages ship via publish — independent pipelines. Publishing before `/icons` is deployed = broken images + 404s across all pages, no graceful degradation. Hard gate: icons merged, deployed, and 404-swept **before** bulk publish.
6. **Basename collisions fail silently.** Content-hash dedupe only catches identical files. Different source files sharing a basename (e.g. `arrow.svg` in 5 legacy folders) collapse to one slug — audit must treat this as a hard error requiring namespaced slugs.
7. **No CSS hook for loose-content icons.** `.icon` is pinned 24×24 in `styles.css`; overrides need a block class. SVGs in plain content flow (no block) have no override path — these are the ones most likely to need the manual post-hoc CSS patch from the accepted-risk mitigation.
8. **Governance / author lock-out.** Icon track = code; content authors can no longer swap these graphics without a PR + deploy. Requires explicit sign-off from the content team, since this now applies to every SVG, not just decorative glyphs.
9. **Minor but costly:** `:name:` shorthand needs surrounding whitespace or adjacent punctuation breaks the match; legacy body copy literally containing `:word:` risks false conversion; `window.hlx.codeBasePath` can resolve differently in Universal Editor preview vs. production — test icons in UE explicitly.

### Script pipeline

All steps are consolidated into a single script, `tools/importer/svg/svg-migrate.cjs`, with subcommands:

- `audit` — inventories unique SVGs across all `asset-mapping*.json`, generates the slug map, flags basename collisions as hard errors. Writes `svg-inventory.json`.
- `download` — downloads every unique `.svg` into `/icons`, dedupes by content hash, sanitizes (`<script>`, `on*=` handlers stripped), sends a browser-like `User-Agent` (avoids `403` on sites that block bare requests). Writes `svg-download-results.json`.
- `verify` — cross-checks the inventory against `/icons`, failing loudly if any icon is missing, empty, or not valid SVG content. Must pass before deploying.
- `clean` — strips `.svg` entries from mapping files (only for successfully downloaded/verified icons — failed ones are kept in place so the gap stays visible) and lowercases all remaining DAM target paths (fixes the case-sensitivity 409 class of errors).
- `all` — chains `audit` → `download` → `verify` in one run. Deliberately stops **before** `clean`, since `/icons` must be committed and deployed first (see edge case 5, deploy ordering hazard).

**Commands:**

```bash
# One-shot: audit + download + verify
node tools/importer/svg/svg-migrate.cjs all "C:\Users\Mahesh.kamble\Downloads\protection\asset-mapping.json" --insecure

# --- commit /icons and DEPLOY before continuing ---

# Strip migrated .svg entries from the mapping and lowercase DAM paths (dry-run first)
node tools/importer/svg/svg-migrate.cjs clean "C:\Users\Mahesh.kamble\Downloads\protection\asset-mapping.json" --dry-run
node tools/importer/svg/svg-migrate.cjs clean "C:\Users\Mahesh.kamble\Downloads\protection\asset-mapping.json"

# Then run the normal bulk upload for the remaining (non-svg) assets
npm run aem-upload -- --token token.txt --zip "..." --asset-mapping "C:\Users\Mahesh.kamble\Downloads\protection\asset-mapping.json" --target https://author-pXXXXX-eYYYYYY.adobeaemcloud.com
```

**Individual subcommands** (for rerunning a single step):

```bash
node tools/importer/svg/svg-migrate.cjs audit <mapping-file-or-dir...> [--out <file>] [--allow-collisions]
node tools/importer/svg/svg-migrate.cjs download [--insecure] [--force]
node tools/importer/svg/svg-migrate.cjs verify
node tools/importer/svg/svg-migrate.cjs clean <mapping-file-or-dir...> [--dry-run]
```

Run `node tools/importer/svg/svg-migrate.cjs --help` for the full option list.

/* global WebImporter */

const getPathname = (value) => {
  if (typeof value !== 'string' || !value.trim()) {
    return '/';
  }

  const strippedValue = value.replace(/^https?:\/\/[^/]+/i, '');
  const pathname = strippedValue.split(/[?#]/)[0];

  return pathname || '/';
};

/**
 * Removes global noise elements from body before processing
 */
const removeGlobalNoise = (document) => {
  WebImporter.DOMUtils.remove(document.body, [
    // Add any global elements to remove early
  ]);
};

const stripBoilerplate = (main) => {
  WebImporter.DOMUtils.remove(main, [
    'header',
    'nav',
    'footer',
    '.header',
    '.footer',
    '.breadcrumbs',
    '.breadcrumb',
    '.blog-bradcrumb',
    '.menu.bottomRight',
    '.reddiv',
    '.consumer-text',
    '.bttm_sticky_product',
    '.new_banner_bottom',
    '.go_to_top',
    'script',
    'style',
    'noscript',
    'form',
  ]);
};

const selectContentRoot = (document) => document.querySelector('section.best-invest.best-invest1.outer')
  || document.querySelector('main')
  || document.body;

/**
 * Transforms top hero section into 'Rte (hero banner)' block
 */
const buildHeroBanner = (main, document) => {
  const heroContainer = main.querySelector('.hero-banner, .blog-header, .top-banner, .banner-div');

  if (!heroContainer) return;

  const rteHeroBlock = WebImporter.DOMUtils.createTable([
    ['Rte (hero banner)'],
    [heroContainer.cloneNode(true)],
  ], document);

  heroContainer.replaceWith(rteHeroBlock);

  // Insert horizontal rule (---) for Section Break after Hero Banner
  const hr = document.createElement('hr');
  rteHeroBlock.after(hr);
};

/**
 * Transforms standard iframe embeds into 'Embed' block
 */
const createEmbedBlocks = (main, document) => {
  const iframes = [...main.querySelectorAll('iframe')];

  iframes.forEach((iframe) => {
    const src = iframe.getAttribute('src');
    if (!src) return;

    const link = document.createElement('a');
    link.href = src;
    link.textContent = src;

    const embedBlock = WebImporter.DOMUtils.createTable([
      ['Embed'],
      [link],
    ], document);

    iframe.replaceWith(embedBlock);
  });
};

/**
 * Transforms card border red container into 'Rte (card border red)' block
 */
const buildRteCardBorderRed = (main, document) => {
  const borderRedContainers = [...main.querySelectorAll('.card-border-red, .red-card-wrapper')];

  borderRedContainers.forEach((container) => {
    const block = WebImporter.DOMUtils.createTable([
      ['Rte (card border red)'],
      [container.cloneNode(true)],
    ], document);

    container.replaceWith(block);
  });
};

/**
 * Transforms FAQs into 'Accordion' block
 */
const appendFaqAccordion = (main, document) => {
  const sourceBlock = document.querySelector('.accordion-div, .faq-accordion');

  if (!sourceBlock) return;

  const items = [...sourceBlock.querySelectorAll('.bor, .accordion-item')]
    .map((item) => {
      const question = item.querySelector('.accordion h3, h3, .accordion-item-label, summary');
      const answer = item.querySelector('.panel, .accordion-item-body');

      if (!question || !answer) return null;

      return [question.cloneNode(true), answer.cloneNode(true)];
    })
    .filter(Boolean);

  if (!items.length) return;

  const accordionBlock = WebImporter.DOMUtils.createTable([
    ['Accordion'],
    ...items,
  ], document);

  sourceBlock.replaceWith(accordionBlock);
};

/**
 * Transforms cards / promo tokens into 'Cards' block
 */
const appendKotakPromos = (main, document) => {
  const sourceSection = document.querySelector('section.consumer.top-0.saving-token.ktk_tkn_card, .cards-wrapper');

  if (!sourceSection) return;

  const tokens = [...sourceSection.querySelectorAll('.product-tokens > .tokens, .cards.block ul li')];

  if (!tokens.length) return;

  const rows = tokens.map((token) => {
    const imageCell = document.createElement('div');
    const textCell = document.createElement('div');

    const image = token.querySelector('.tokenImg img, img');
    const title = token.querySelector('h4, h3');
    const description = token.querySelector('p');
    const link = token.querySelector('a');

    if (image) {
      const picture = document.createElement('picture');
      picture.append(image.cloneNode(true));
      imageCell.append(picture);
    }

    if (title) textCell.append(title.cloneNode(true));
    if (description) textCell.append(description.cloneNode(true));
    if (link) textCell.append(link.cloneNode(true));

    return [imageCell, textCell];
  });

  const cardsBlock = WebImporter.DOMUtils.createTable([
    ['Cards'],
    ...rows,
  ], document);

  sourceSection.replaceWith(cardsBlock);
};

/**
 * Transforms Disclaimer section into 'Accordion (disclaimer)' block
 */
const appendDisclaimerAccordion = (main, document) => {
  const disclaimerContainer = document.querySelector('#terms-conditions, section.abovespace, .terms, .accordion.disclaimer');

  if (!disclaimerContainer) return;

  const disclaimerButton = disclaimerContainer.querySelector('.collapsible, button.terms-txt, .terms-txt, summary');
  const disclaimerBody = disclaimerContainer.querySelector('.content-col, .terms-para, .accordion-item-body');

  if (!disclaimerButton || !disclaimerBody) return;

  const label = document.createElement('h3');
  label.textContent = disclaimerButton.textContent.trim() || 'Disclaimer';

  const accordionBlock = WebImporter.DOMUtils.createTable([
    ['Accordion (disclaimer)'],
    [label, disclaimerBody.cloneNode(true)],
  ], document);

  const targetToRemove = disclaimerContainer.closest('section') || disclaimerContainer;
  targetToRemove.replaceWith(accordionBlock);
};

/**
 * Transforms Bookmark Link sections into 'Rte (bookmarks links)' block
 */
const buildBookmarksRte = (main, document) => {
  const bookmarkContainers = [...main.querySelectorAll('.bookmarks-links, .calculator-bookmarks')];

  bookmarkContainers.forEach((container) => {
    const block = WebImporter.DOMUtils.createTable([
      ['Rte (bookmarks links)'],
      [container.cloneNode(true)],
    ], document);

    container.replaceWith(block);
  });
};

/**
 * Wraps any remaining raw HTML tables (like tax/data tables) in 'RTE' blocks to avoid modelId errors
 */
const protectAndWrapContentTables = (main, document) => {
  const tables = [...main.querySelectorAll('table')];

  tables.forEach((table) => {
    const firstRow = table.querySelector('tr');
    const firstCell = firstRow?.querySelector('th, td');
    const firstCellText = firstCell?.textContent?.trim().toLowerCase() || '';

    const knownBlocks = ['accordion', 'embed', 'metadata', 'cards', 'rte'];
    if (knownBlocks.some((block) => firstCellText.startsWith(block))) {
      return;
    }

    const rteBlock = WebImporter.DOMUtils.createTable([
      ['RTE'],
      [table.cloneNode(true)],
    ], document);

    table.replaceWith(rteBlock);
  });
};

/**
 * Organizes section breaks (---) before "Also read" and after bookmarks
 */
const buildSections = (main, document) => {
  const alsoRead = main.querySelector('.also-readd, #also-read');
  if (alsoRead) {
    const hrBefore = document.createElement('hr');
    alsoRead.before(hrBefore);
  }

  const bookmarkBlocks = main.querySelectorAll('table');
  if (bookmarkBlocks.length > 0) {
    const lastBookmark = bookmarkBlocks[bookmarkBlocks.length - 1];
    const hrAfter = document.createElement('hr');
    lastBookmark.after(hrAfter);
  }
};

/**
 * Appends Metadata block at the bottom of the main document
 */
const appendMetadataBlockAtBottom = (main, document) => {
  const metadata = {};

  const title = document.querySelector('title');
  const description = document.querySelector('meta[name="description"], meta[property="og:description"]');
  const image = document.querySelector('meta[property="og:image"]');

  metadata.Title = title?.textContent ? title.textContent.trim() : 'Blog Details';
  
  if (description?.content) {
    metadata.Description = description.content.trim();
  }

  if (image?.content) {
    const img = document.createElement('img');
    img.src = image.content;
    metadata.Image = img;
  }

  metadata['Published Time'] = new Date().toISOString();
  metadata['Modified Time'] = new Date().toISOString();

  const metadataBlock = WebImporter.Blocks.getMetadataBlock(document, metadata);
  main.append(metadataBlock);
};

export default {
  transformDOM: ({ document }) => {
    removeGlobalNoise(document);

    const main = selectContentRoot(document);

    // 1. Convert top Hero section
    buildHeroBanner(main, document);

    // 2. Convert standard inline components
    createEmbedBlocks(main, document);
    buildRteCardBorderRed(main, document);
    appendFaqAccordion(main, document);
    appendKotakPromos(main, document);
    appendDisclaimerAccordion(main, document);

    // 3. Convert Bookmark Links & Content Tables
    buildBookmarksRte(main, document);
    protectAndWrapContentTables(main, document);

    // 4. Clean up boilerplate HTML elements
    stripBoilerplate(main);

    WebImporter.DOMUtils.remove(main, [
      '.authorBox',
      '.authornew',
      '.hide-mobile',
      '.col-md-6 form',
    ]);

    // 5. Structure Section Breaks (---)
    buildSections(main, document);

    // 6. Append Metadata block at the bottom
    appendMetadataBlockAtBottom(main, document);

    return main;
  },

  generateDocumentPath: ({ url, params }) => {
    const pathname = getPathname(params?.originalURL || url);
    const documentPath = pathname === '/' ? '/index' : pathname.replace(/\/$/, '');

    return WebImporter.FileUtils.sanitizePath(documentPath);
  },
};
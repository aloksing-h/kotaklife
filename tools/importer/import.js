/* global WebImporter */

const getPathname = (value) => {
  if (typeof value !== 'string' || !value.trim()) {
    return '/';
  }

  const strippedValue = value.replace(/^https?:\/\/[^/]+/i, '');
  const pathname = strippedValue.split(/[?#]/)[0];

  return pathname || '/';
};

const removeGlobalNoise = (document) => {
  WebImporter.DOMUtils.remove(document.body, []);
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
 * HELPER: Creates a Section Metadata table and appends a section break (---)
 */
const appendSectionMetadata = (element, style, document) => {
  const sectionMetaData = WebImporter.DOMUtils.createTable([
    ['Section Metadata'],
    ['Style', style],
  ], document);

  element.append(sectionMetaData);
  element.append(document.createElement('hr'));
};

/**
 * Parses section.blog-head and appends a 'hero-banner' Section Metadata
 */
const buildHeroBanner = (main, document) => {
  const blogHead = document.querySelector('section.blog-head') || main.querySelector('.hero-banner');

  if (!blogHead) return;

  const heroContainer = document.createElement('div');

  // 1. Heading (H1)
  const h1 = blogHead.querySelector('h1');
  if (h1) {
    heroContainer.append(h1.cloneNode(true));
  }

  // 2. Subtitle / Description Paragraph
  const desc = blogHead.querySelector('.text-center > p');
  if (desc) {
    heroContainer.append(desc.cloneNode(true));
  }

  // 3. Metadata (Views, Date & AI Badge)
  const viewsLi = blogHead.querySelector('.blogs-ul li:first-child');
  const smileSpan = blogHead.querySelector('.smile_ai span');

  if (viewsLi || smileSpan) {
    const metaP = document.createElement('p');
    let metaText = viewsLi ? viewsLi.textContent.trim() : '';
    if (smileSpan) {
      metaText += ` :smile-grey: ${smileSpan.textContent.trim()}`;
    }
    metaP.textContent = metaText;
    heroContainer.append(metaP);
  }

  // 4. Nested Dropdown Menu
  const drpwnWrapper = blogHead.querySelector('.drpwn-wrapper');
  if (drpwnWrapper) {
    const mainUl = document.createElement('ul');
    const mainLi = document.createElement('li');

    const labelLink = drpwnWrapper.querySelector('.drpwn-label a, .drpwn-label');
    const mainLabelText = labelLink ? labelLink.textContent.trim() : 'Get Lumpsum Return';

    const labelP = document.createElement('p');
    labelP.textContent = `${mainLabelText} :chevron-down:`;
    mainLi.append(labelP);

    // Child menu items
    const menuItems = [...drpwnWrapper.querySelectorAll('.drpwn-menu li')];
    if (menuItems.length) {
      const subUl = document.createElement('ul');
      menuItems.forEach((item, index) => {
        const subLi = document.createElement('li');
        const itemText = item.querySelector('span:last-child')?.textContent.trim()
          || item.querySelector('a')?.textContent.trim()
          || item.textContent.trim();

        const iconName = index === 0 ? ':economic-crisis:' : `:economic-crisis${index}:`;
        subLi.textContent = `${iconName} ${itemText}`;
        subUl.append(subLi);
      });
      mainLi.append(subUl);
    }

    mainUl.append(mainLi);
    heroContainer.append(mainUl);
  }

  // Append Section Metadata instead of a Block Table
  appendSectionMetadata(heroContainer, 'hero-banner', document);

  blogHead.replaceWith(heroContainer);

  if (!main.contains(heroContainer)) {
    main.prepend(heroContainer);
  }
};

/**
 * Transforms iframe elements into an 'Embed' block
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
 * Transforms red card containers by applying 'card-border-red' Section Metadata
 */
const formatCardBorderRed = (main, document) => {
  const borderRedContainers = [...main.querySelectorAll('.card-border-red, .red-card-wrapper')];

  borderRedContainers.forEach((container) => {
    appendSectionMetadata(container, 'card-border-red', document);
  });
};

/**
 * Transforms FAQs into an 'Accordion' block
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

  if (!main.contains(accordionBlock)) {
    main.append(accordionBlock);
  }
};

/**
 * Transforms promo tokens / cards into a 'Cards' block
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
 * Transforms Disclaimer section into an 'Accordion (disclaimer)' block
 */
const appendDisclaimerAccordion = (main, document) => {
  const disclaimerContainer = document.querySelector(
    '#terms-conditions, section.abovespace, .terms, .accordion.disclaimer, [class*="disclaimer"]',
  );

  if (!disclaimerContainer) return;

  const disclaimerButton = disclaimerContainer.querySelector(
    '.collapsible, button.terms-txt, .terms-txt, summary, .accordion-item-label, h2, h3, h4',
  );

  let disclaimerBody = disclaimerContainer.querySelector(
    '.content-col, .terms-para, .accordion-item-body, .accordion-item-body-content',
  );

  if (!disclaimerBody) {
    const paragraphs = disclaimerContainer.querySelectorAll('p');
    if (paragraphs.length > 0) {
      disclaimerBody = document.createElement('div');
      paragraphs.forEach((p) => disclaimerBody.append(p.cloneNode(true)));
    }
  }

  if (!disclaimerBody) return;

  const label = document.createElement('h3');
  const labelText = disclaimerButton ? disclaimerButton.textContent.trim() : 'Disclaimer';
  label.textContent = labelText.replace(/[\n\r\t]+/g, ' ') || 'Disclaimer';

  const accordionBlock = WebImporter.DOMUtils.createTable([
    ['Accordion (disclaimer)'], // UPDATED HERE
    [label, disclaimerBody.cloneNode(true)],
  ], document);

  const targetToRemove = disclaimerContainer.closest('section') || disclaimerContainer;
  targetToRemove.replaceWith(accordionBlock);

  if (!main.contains(accordionBlock)) {
    main.append(accordionBlock);
  }
};

/**
 * Transforms Bookmark Link sections by applying 'bookmarks-links' Section Metadata
 */
const formatBookmarks = (main, document) => {
  const bookmarkContainers = [...main.querySelectorAll('.bookmarks-links, .calculator-bookmarks')];

  bookmarkContainers.forEach((container) => {
    appendSectionMetadata(container, 'bookmarks-links', document);
  });
};

/**
 * SOLVES THE 'modelId' ERROR:
 * Converts inner HTML content tables into Markdown tables before placing them
 * inside the RTE block so that no nested <table> DOM nodes trigger block scanning.
 */
const protectAndWrapContentTables = (main, document) => {
  const tables = [...main.querySelectorAll('table')];

  tables.forEach((table) => {
    const firstRow = table.querySelector('tr');
    const firstCell = firstRow?.querySelector('th, td');
    const firstCellText = firstCell?.textContent?.trim().toLowerCase() || '';

    const knownBlocks = ['accordion', 'embed', 'metadata', 'cards', 'rte', 'section metadata'];
    if (knownBlocks.some((block) => firstCellText.startsWith(block))) {
      return;
    }

    const rows = [...table.querySelectorAll('tr')];
    if (!rows.length) return;

    const matrix = rows.map((row) => [...row.querySelectorAll('th, td')]
      .map((cell) => cell.innerHTML.trim().replace(/\|/g, '\\|').replace(/\n+/g, ' ')));

    if (matrix.length > 0) {
      const header = matrix[0];
      const mdLines = [];
      mdLines.push(`| ${header.join(' | ')} |`);
      mdLines.push(`| ${header.map(() => '---').join(' | ')} |`);

      matrix.slice(1).forEach((row) => {
        mdLines.push(`| ${row.join(' | ')} |`);
      });

      const container = document.createElement('div');
      container.innerHTML = mdLines.join('<br>');

      const rteBlock = WebImporter.DOMUtils.createTable([
        ['RTE'],
        [container],
      ], document);

      table.replaceWith(rteBlock);
    }
  });
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

    // 1. Process Hero Banner block
    buildHeroBanner(main, document);

    // 2. Process inline EDS blocks
    createEmbedBlocks(main, document);
    formatCardBorderRed(main, document);
    appendFaqAccordion(main, document);
    appendKotakPromos(main, document);
    appendDisclaimerAccordion(main, document);

    // 3. Process Bookmark Links and raw HTML tables
    formatBookmarks(main, document);
    protectAndWrapContentTables(main, document);

    // 4. Remove boilerplate noise
    stripBoilerplate(main);

    WebImporter.DOMUtils.remove(main, [
      '.authorBox',
      '.authornew',
      '.hide-mobile',
      '.col-md-6 form',
    ]);

    // 5. Append Metadata block at bottom
    appendMetadataBlockAtBottom(main, document);

    return main;
  },

  generateDocumentPath: ({ url, params }) => {
    const pathname = getPathname(params?.originalURL || url);
    const documentPath = pathname === '/' ? '/index' : pathname.replace(/\/$/, '');

    return WebImporter.FileUtils.sanitizePath(documentPath);
  },
};

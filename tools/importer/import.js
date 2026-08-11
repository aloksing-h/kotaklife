/* global WebImporter */

const getPathname = (value) => {
  if (typeof value !== 'string' || !value.trim()) {
    return '/';
  }

  const strippedValue = value.replace(/^https?:\/\/[^/]+/i, '');
  const pathname = strippedValue.split(/[?#]/)[0];

  return pathname || '/';
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
    '.consumer',
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

const appendPopularSearches = (main, document) => {
  const popularList = document.querySelector('.popular_list');

  if (popularList && !main.contains(popularList)) {
    main.append(popularList);
  }
};

const buildTokenCard = (document, token) => {
  const card = document.createElement('div');
  const imageCell = document.createElement('div');
  const bodyCell = document.createElement('div');
  const image = token.querySelector('.tokenImg img');
  const title = token.querySelector('h4');
  const description = token.querySelector('p');
  const link = token.querySelector('a.tokensInvest');

  if (image) {
    const picture = document.createElement('picture');
    picture.append(image.cloneNode(true));
    imageCell.append(picture);
  }

  if (title) {
    bodyCell.append(title.cloneNode(true));
  }

  if (description) {
    bodyCell.append(description.cloneNode(true));
  }

  if (link) {
    bodyCell.append(link.cloneNode(true));
  }

  card.append(imageCell, bodyCell);

  return card;
};

/**
 * Transforms Kotak Promos into a valid EDS Cards block
 */
const appendKotakPromos = (main, document) => {
  const sourceSection = document.querySelector('section.consumer.top-0.saving-token.ktk_tkn_card');

  if (!sourceSection) {
    return;
  }

  const tokens = [...sourceSection.querySelectorAll('.product-tokens > .tokens')];

  if (!tokens.length) {
    return;
  }

  const rows = tokens.map((token) => [buildTokenCard(document, token)]);

  const cardsBlock = WebImporter.DOMUtils.createTable([
    ['Cards'],
    ...rows,
  ], document);

  sourceSection.replaceWith(cardsBlock);

  if (!main.contains(cardsBlock)) {
    main.append(cardsBlock);
  }
};

/**
 * Transforms FAQ sections into an Accordion block
 */
const appendFaqAccordion = (main, document) => {
  const sourceBlock = document.querySelector('.accordion-div');

  if (!sourceBlock) {
    return;
  }

  const items = [...sourceBlock.querySelectorAll('.bor')]
    .map((item) => {
      const question = item.querySelector('.accordion h3, h3');
      const answer = item.querySelector('.panel');

      if (!question || !answer) {
        return null;
      }

      return [question.cloneNode(true), answer.cloneNode(true)];
    })
    .filter(Boolean);

  if (!items.length) {
    return;
  }

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
 * Transforms Disclaimer section into an Accordion block
 */
const appendDisclaimerAccordion = (main, document) => {
  const disclaimerContainer = document.querySelector('#terms-conditions, section.abovespace, .terms');

  if (!disclaimerContainer) {
    return;
  }

  const disclaimerButton = disclaimerContainer.querySelector('.collapsible, button.terms-txt, .terms-txt');
  const disclaimerBody = disclaimerContainer.querySelector('.content-col, .terms-para');

  if (!disclaimerButton || !disclaimerBody) {
    return;
  }

  const question = document.createElement('h3');
  question.textContent = disclaimerButton.textContent.trim() || 'Disclaimer';

  const accordionBlock = WebImporter.DOMUtils.createTable([
    ['Accordion'],
    [question, disclaimerBody.cloneNode(true)],
  ], document);

  const targetToRemove = disclaimerContainer.closest('section') || disclaimerContainer;
  targetToRemove.replaceWith(accordionBlock);

  if (!main.contains(accordionBlock)) {
    main.append(accordionBlock);
  }
};

/**
 * Converts iframe elements into an Embed block
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
 * Wraps content HTML tables into the 'RTE' block matching the Universal Editor definition
 */
const createRTEBlocks = (main, document) => {
  const tables = [...main.querySelectorAll('table')];

  tables.forEach((table) => {
    // Prevent re-wrapping tables that are already standard EDS blocks
    const firstCell = table.querySelector('tr:first-child th, tr:first-child td');
    const firstCellText = firstCell?.textContent?.trim().toLowerCase() || '';

    const knownBlocks = ['accordion', 'embed', 'metadata', 'cards', 'rte', 'table'];
    if (knownBlocks.some((block) => firstCellText.startsWith(block))) {
      return;
    }

    // Wraps raw table into the 'RTE' block matching definition title: "RTE"
    const rteBlock = WebImporter.DOMUtils.createTable([
      ['RTE'], 
      [table.cloneNode(true)],
    ], document);

    table.replaceWith(rteBlock);
  });
};

const appendAlsoRead = (main, document) => {
  const alsoRead = document.querySelector('.also-readd');

  if (alsoRead && !main.contains(alsoRead)) {
    main.append(alsoRead);
  }
};

const removeGlobalNoise = (document) => {
  WebImporter.DOMUtils.remove(document.body, []);
};

const appendMetadataBlock = (main, document) => {
  const metadata = {};
  const title = document.querySelector('title');
  const description = document.querySelector('meta[name="description"], meta[property="og:description"]');
  const image = document.querySelector('meta[property="og:image"]');

  if (title?.textContent) {
    metadata.Title = title.textContent.trim();
  }

  if (description?.content) {
    metadata.Description = description.content.trim();
  }

  if (image?.content) {
    const img = document.createElement('img');
    img.src = image.content;
    metadata.Image = img;
  }

  main.prepend(WebImporter.Blocks.getMetadataBlock(document, metadata));
};

export default {
  transformDOM: ({ document }) => {
    removeGlobalNoise(document);

    const main = selectContentRoot(document);

    // 1. Convert components into valid EDS / AEM blocks
    appendMetadataBlock(main, document);
    appendKotakPromos(main, document);
    appendDisclaimerAccordion(main, document);
    appendFaqAccordion(main, document);
    createEmbedBlocks(main, document);
    createRTEBlocks(main, document);

    // 2. Cleanups and additional appendings
    appendAlsoRead(main, document);
    stripBoilerplate(main);

    WebImporter.DOMUtils.remove(main, [
      '.authorBox',
      '.authornew',
      '.hide-mobile',
      '.col-md-6 form',
    ]);

    appendPopularSearches(main, document);

    return main;
  },

  generateDocumentPath: ({ url, params }) => {
    const pathname = getPathname(params?.originalURL || url);
    const documentPath = pathname === '/' ? '/index' : pathname.replace(/\/$/, '');

    return WebImporter.FileUtils.sanitizePath(documentPath);
  },
};
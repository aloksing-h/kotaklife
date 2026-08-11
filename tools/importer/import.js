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
    // 'iframe',
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

const appendKotakPromos = (main, document) => {
  const sourceSection = document.querySelector('section.consumer.top-0.saving-token.ktk_tkn_card');

  if (!sourceSection) {
    return;
  }

  const tokens = [...sourceSection.querySelectorAll('.product-tokens > .tokens')];

  if (!tokens.length) {
    return;
  }

  const cardsBlock = document.createElement('div');
  cardsBlock.className = 'cards saving-token ktk_tkn_card';

  tokens.forEach((token) => {
    cardsBlock.append(buildTokenCard(document, token));
  });

  sourceSection.replaceWith(cardsBlock);

  if (!main.contains(cardsBlock)) {
    main.append(cardsBlock);
  }
};

const createAccordionBlock = (document, items, blockName) => {
  const block = document.createElement('table');
  const headerRow = document.createElement('tr');
  const headerCell = document.createElement('td');

  headerCell.textContent = blockName;
  headerRow.append(headerCell);
  block.append(headerRow);

  items.forEach(({ question, answer }) => {
    const row = document.createElement('tr');
    const questionCell = document.createElement('td');
    const answerCell = document.createElement('td');

    if (question) {
      questionCell.append(question.cloneNode(true));
    }

    if (answer) {
      answerCell.append(answer.cloneNode(true));
    }

    row.append(questionCell, answerCell);
    block.append(row);
  });

  return block;
};

const appendDisclaimerAccordion = (main, document) => {
  const sourceSection = document.querySelector('section.abovespace');
  const disclaimerButton = sourceSection?.querySelector('button.collapsible.terms-txt');
  const disclaimerBody = sourceSection?.querySelector('.content-col');

  if (!sourceSection || !disclaimerButton || !disclaimerBody) {
    return;
  }

  const accordionBlock = createAccordionBlock(document, [
    {
      question: disclaimerButton,
      answer: disclaimerBody,
    },
  ], 'Accordion');

  accordionBlock.className = 'accordion disclaimer-accordion';

  sourceSection.replaceWith(accordionBlock);

  if (!main.contains(accordionBlock)) {
    main.append(accordionBlock);
  }
};

const appendFaqAccordion = (main, document) => {
  const sourceBlock = document.querySelector('.accordion-div');

  if (!sourceBlock) {
    return;
  }

  const items = [...sourceBlock.querySelectorAll('.bor')]
    .map((item) => {
      const question = item.querySelector('.accordion h3');
      const answer = item.querySelector('.panel');

      if (!question || !answer) {
        return null;
      }

      return { question, answer };
    })
    .filter(Boolean);

  if (!items.length) {
    return;
  }

  const accordionBlock = createAccordionBlock(document, items, 'Accordion');
  accordionBlock.className = 'accordion faq-accordion';

  sourceBlock.replaceWith(accordionBlock);

  if (!main.contains(accordionBlock)) {
    main.append(accordionBlock);
  }
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

    appendMetadataBlock(main, document);
    appendKotakPromos(main, document);
    appendDisclaimerAccordion(main, document);
    appendFaqAccordion(main, document);
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

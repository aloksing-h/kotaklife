/* global WebImporter */

const getPathname = (value) => {
  if (typeof value !== 'string' || !value.trim()) {
    return '/';
  }
  const strippedValue = value.replace(/^https?:\/\/[^/]+/i, '');
  return strippedValue.split(/[?#]/)[0] || '/';
};

// Falls back to <body> if the expected wrapper class is missing
const selectContentRoot = (document) => document.querySelector('.best-invest.best-invest1.outer') || document.body;

const removeGlobalNoise = (main) => {
  WebImporter.DOMUtils.remove(main, [
    '.blog-bradcrumb',
    '.menu.bottomRight',
    '.kotak-eterm-plan-popup',
    '.blog-social-meida',
    '.reddiv',
    '.hide-mobile',
    '.kotak-e-term-plan',
    '.also-read',
    '#leadformem',
    'script', 'style', 'noscript', 'form',
  ]);
};

/**
 * SANITIZE MALFORMED HEADINGS
 * Fixes broken source HTML where an <h2> tag illegally wraps <div> containers
 * (such as Accordions or Suggested Readings sections).
 */
const fixMalformedHeadings = (main) => {
  const headings = [...main.querySelectorAll('h1, h2, h3, h4, h5, h6')];
  headings.forEach((heading) => {
    // If a heading tag contains block-level elements, unwrap it into a neutral <div>
    if (heading.querySelector('div, section, ul, ol, table, article')) {
      const div = document.createElement('div');
      div.className = heading.className;
      div.append(...heading.childNodes);
      heading.replaceWith(div);
    }
  });
};

/**
 * SANITIZE REDUNDANT HEADING FORMATTING
 * Removes <b> and <strong> tags from inside headings to prevent
 * the markdown parser from escaping them into literal text.
 */
const cleanHeadingFormatting = (main) => {
  const headings = [...main.querySelectorAll('h1, h2, h3, h4, h5, h6')];

  headings.forEach((heading) => {
    const boldTags = [...heading.querySelectorAll('b, strong')];
    boldTags.forEach((b) => {
      // Replace the <b> tag with its inner text, removing the HTML wrapper
      b.replaceWith(...b.childNodes);
    });
  });
};

/**
 * HELPER: Creates a Section Metadata table and appends a section break (---)
 * STRICT PLACEMENT: Must be siblings of the content wrapper.
 */
const appendSectionMetadata = (element, style, document, addBreak = true) => {
  const sectionMetaData = WebImporter.DOMUtils.createTable([
    ['Section Metadata'],
    ['style', style], // Lowercase 'style' is safer for AEM scripts.js
  ], document);

  element.after(sectionMetaData);
  // Only add the hr if requested
  if (addBreak) {
    sectionMetaData.after(document.createElement('hr'));
  }
};

const buildHeroBanner = (main, document) => {
  const blogHead = main.querySelector('.blog-head');
  if (!blogHead) return;

  const heroContainer = document.createElement('div');

  const h1 = blogHead.querySelector('h1');
  if (h1) heroContainer.append(h1.cloneNode(true));

  const desc = blogHead.querySelector('.text-center > p');
  if (desc) heroContainer.append(desc.cloneNode(true));

  // Extract metadata (Views / Date / Human expertise pill)
  const viewsLi = blogHead.querySelector('.blogs-ul li:first-child');
  const smileDiv = blogHead.querySelector('.smile_div, .smile_ai');

  // Combine both into a single paragraph so they render on the same line
  if (viewsLi || smileDiv) {
    const metaP = document.createElement('p');
    let metaText = '';

    if (viewsLi) {
      metaText += viewsLi.textContent.trim();
    }

    if (smileDiv) {
      const smileText = smileDiv.querySelector('span')?.textContent.trim() || 'Human expertise, no AI';
      if (metaText.length > 0) {
        metaText += ' '; // Add space between date and icon
      }
      metaText += `:smile-grey: ${smileText}`;
    }

    metaP.textContent = metaText;
    heroContainer.append(metaP);
  }

  const drpwnWrapper = blogHead.querySelector('.drpwn-wrapper');
  const btnLink = blogHead.querySelector('.btnLink a');

  if (drpwnWrapper) {
    const mainUl = document.createElement('ul');
    const mainLi = document.createElement('li');

    const labelLink = drpwnWrapper.querySelector('.drpwn-label a');
    if (labelLink) {
      const clonedLink = labelLink.cloneNode(true);
      clonedLink.textContent = clonedLink.textContent.trim();
      mainLi.append(clonedLink);
      // Place the icon shorthand outside the link
      mainLi.append(document.createTextNode(' :chevron-down:'));
    } else {
      const labelText = drpwnWrapper.querySelector('.drpwn-label')?.textContent.trim();
      if (labelText) mainLi.textContent = `${labelText} :chevron-down:`;
    }

    const menuItems = [...drpwnWrapper.querySelectorAll('.drpwn-menu li a')];
    if (menuItems.length > 0) {
      const subUl = document.createElement('ul');
      menuItems.forEach((item, index) => {
        const subLi = document.createElement('li');
        const textSpan = item.querySelector('span:not(.drpwn-icon)');

        const cleanLink = document.createElement('a');
        cleanLink.href = item.href;

        const iconName = index === 0 ? 'economic-crisis' : `economic-crisis${index}`;
        const linkText = textSpan ? textSpan.textContent.trim() : item.textContent.trim();

        cleanLink.textContent = linkText;

        // Prepend the icon shorthand outside the link
        subLi.append(document.createTextNode(`:${iconName}: `));
        subLi.append(cleanLink);

        subUl.append(subLi);
      });
      mainLi.append(subUl);
    }
    mainUl.append(mainLi);
    heroContainer.append(mainUl);
  } else if (btnLink) {
    const btnP = document.createElement('p');
    btnP.append(btnLink.cloneNode(true));
    heroContainer.append(btnP);
  }

  blogHead.replaceWith(heroContainer);
  appendSectionMetadata(heroContainer, 'hero-banner', document);
};

const createEmbedBlocks = (main, document) => {
  const iframes = [...main.querySelectorAll('iframe')];
  iframes.forEach((iframe) => {
    const src = iframe.getAttribute('src');
    if (!src) {
      iframe.remove();
      return;
    }
    const link = document.createElement('a');
    link.href = src;
    link.textContent = src;

    const embedBlock = WebImporter.DOMUtils.createTable([
      ['Embed (yt-video)'],
      [link],
    ], document);

    iframe.replaceWith(embedBlock);
  });
};

/**
 * FAQ ACCORDIONS
 * Works cleanly now that malformed outer headings are neutralized.
 */
const appendFaqAccordion = (main, document) => {
  const borItems = [...main.querySelectorAll('.bor')];
  if (!borItems.length) return;

  const items = [];

  borItems.forEach((item) => {
    const question = item.querySelector('.accordion h3, h3, h4');
    const answer = item.querySelector('.panel');

    if (question && answer) {
      items.push([question.cloneNode(true), answer.cloneNode(true)]);
    }
  });

  if (!items.length) return;

  const accordionBlock = WebImporter.DOMUtils.createTable([
    ['Accordion (faq-accordion)'],
    ...items,
  ], document);

  const wrapper = main.querySelector('.accordion-div');
  if (wrapper) {
    wrapper.replaceWith(accordionBlock);
  } else {
    borItems[0].replaceWith(accordionBlock);
  }

  // Clean up remaining duplicate .bor elements
  borItems.slice(1).forEach((bor) => bor.remove());
};

// Wraps .insuranceSections elements inside an RTE V2 block with the 'card-border-red' class
const buildInsuranceSectionsBlocks = (main, document) => {
  const insuranceSections = [...main.querySelectorAll('.insuranceSections')];
  if (!insuranceSections.length) return;

  insuranceSections.forEach((section) => {
    const blogBoxes = [...section.querySelectorAll('.blogBox')];
    const list = document.createElement('ul');

    blogBoxes.forEach((box) => {
      const heading = box.querySelector('h3');
      if (!heading) return;

      const li = document.createElement('li');
      li.append(heading.cloneNode(true));

      const paragraph = box.querySelector('p');
      if (paragraph) {
        const innerLi = document.createElement('li');
        innerLi.append(...paragraph.cloneNode(true).childNodes);
        const innerUl = document.createElement('ul');
        innerUl.append(innerLi);
        li.append(innerUl);
      }

      list.append(li);
    });

    const rteBlock = WebImporter.DOMUtils.createTable([
      ['RTE V2 (card-border-red)'],
      [list],
    ], document);

    section.replaceWith(rteBlock);
  });
};

// Converts author box to Profile Cards block and seals the first column section
const buildProfileCards = (main, document) => {
  const authorBoxes = [...main.querySelectorAll('.authorBox')];
  if (!authorBoxes.length) return;

  authorBoxes.forEach((box) => {
    const imageCell = document.createElement('div');
    const textCell = document.createElement('div');

    const img = box.querySelector('.authorImg img');
    if (img) imageCell.append(img.cloneNode(true));

    const titleDiv = box.querySelector('.nameTitle div');
    if (titleDiv) {
      // Strip HTML comments left in the source markup
      const reviewedText = titleDiv.textContent.replace(/<!--[\s\S]*?-->/g, '').trim();
      if (reviewedText) {
        const reviewedP = document.createElement('p');
        reviewedP.textContent = reviewedText;
        textCell.append(reviewedP);
      }
    }

    const nameElement = box.querySelector('.nameTag');
    if (nameElement) {
      const nameP = document.createElement('p');
      nameP.innerHTML = `<strong>${nameElement.textContent.trim()}</strong>`;
      textCell.append(nameP);
    }

    // Tooltip description and LinkedIn icon are combined into a single paragraph
    const descElement = box.querySelector('.tooltiptext p:first-of-type');
    const linkedinElement = box.querySelector('.tooltiptext a.linkedin');

    if (descElement || linkedinElement) {
      const tooltipContainer = document.createElement('p');

      if (descElement) {
        tooltipContainer.innerHTML = descElement.innerHTML;
      }

      if (linkedinElement) {
        tooltipContainer.appendChild(document.createElement('br'));

        // Use icon shorthand span instead of the original link
        const linkedinSpan = document.createElement('span');
        linkedinSpan.className = 'linkedin-icon';
        linkedinSpan.textContent = ':linkedin:';

        tooltipContainer.appendChild(linkedinSpan);
      }

      textCell.append(tooltipContainer);
    }

    const profileBlock = WebImporter.DOMUtils.createTable([
      ['Cards (profile cards)'],
      [imageCell, textCell],
    ], document);

    box.replaceWith(profileBlock);

    if (typeof appendSectionMetadata === 'function') {
      appendSectionMetadata(profileBlock, 'column-left-section', document);
    }
  });
};

const appendKotakPromos = (main, document) => {
  const sourceSection = document.querySelector('.saving-token');
  if (!sourceSection) return;

  const tokens = [...sourceSection.querySelectorAll('.tokens')];
  if (!tokens.length) return;

  const rows = tokens.map((token) => {
    const imageCell = document.createElement('div');
    const textCell = document.createElement('div');

    const image = token.querySelector('img');
    const title = token.querySelector('h4');
    const description = token.querySelector('p');
    const link = token.querySelector('a');

    if (image) imageCell.append(image.cloneNode(true));
    if (title) textCell.append(title.cloneNode(true));
    if (description) textCell.append(description.cloneNode(true));
    if (link) textCell.append(link.cloneNode(true));

    return [imageCell, textCell];
  });

  const cardsBlock = WebImporter.DOMUtils.createTable([
    ['Cards (financial cards)'],
    ...rows,
  ], document);

  sourceSection.replaceWith(cardsBlock);
  main.append(cardsBlock);
};

/**
 * Wraps bookmark containers inside an RTE V2 block, applies 'bookmark-section'
 * style to the section, and injects an arrow icon after each link.
 */
const formatBookmarks = (main, document) => {
  const bookmarkContainers = [...main.querySelectorAll('.check-calculators')];
  if (!bookmarkContainers.length) return;

  bookmarkContainers.forEach((container, index) => {
    const listLinks = container.querySelectorAll('ul li a');
    listLinks.forEach((link) => {
      link.after(document.createTextNode(' :rightarrowblack: '));
    });

    const rteBlock = WebImporter.DOMUtils.createTable([
      ['RTE V2 (bookmarks-links)'],
      [container.cloneNode(true)] 
    ], document);

    container.replaceWith(rteBlock);

    // Only the last bookmark container gets the section break
    if (index === bookmarkContainers.length - 1) {
      appendSectionMetadata(rteBlock, 'bookmark-section', document);
    }
  });
};

const appendDisclaimerAccordion = (main, document) => {
  const disclaimerContainer = document.querySelector('.abovespace .terms');
  if (!disclaimerContainer) return;

  const label = document.createElement('h3');
  label.textContent = 'Disclaimer';

  const disclaimerBody = disclaimerContainer.querySelector('.content-col');

  if (disclaimerBody) {
    const accordionBlock = WebImporter.DOMUtils.createTable([
      ['Accordion (disclaimer)'],
      [label, disclaimerBody.cloneNode(true)],
    ], document);

    const targetToRemove = document.querySelector('.abovespace') || disclaimerContainer;
    targetToRemove.replaceWith(accordionBlock);
    main.append(accordionBlock);
  }
};

/**
 * POPULAR SEARCHES SECTION
 * Converts the popular searches list into a default-content section
 * styled with the 'popular-search' Section Metadata. The label list item
 * (e.g. "POPULAR SEARCHES :") is preserved untouched.
 */
const appendPopularSearches = (main, document) => {
  const source = document.querySelector('.popular_list, .popular_searches_new');
  if (!source) return;

  const list = source.querySelector('ul');
  if (!list) return;

  source.replaceWith(list);
  main.append(list);
  appendSectionMetadata(list, 'popular-search', document, false);
};

const appendMetadataBlockAtBottom = (main, document) => {
  const metadata = {};
  const title = document.querySelector('title');
  const description = document.querySelector('meta[name="description"], meta[property="og:description"]');
  const image = document.querySelector('meta[property="og:image"]');

  if (title?.textContent) metadata.Title = title.textContent.trim();
  if (description?.content) metadata.Description = description.content.trim();
  if (image?.content) {
    const img = document.createElement('img');
    img.src = image.content;
    metadata.Image = img;
  }

  const metadataBlock = WebImporter.Blocks.getMetadataBlock(document, metadata);
  main.append(metadataBlock);
};

// Wraps <ul class="bullet-pink"> elements inside an RTE V2 block
const buildPinkBulletRteBlocks = (main, document) => {
  const pinkLists = [...main.querySelectorAll('ul.bullet-pink')];
  if (!pinkLists.length) return;

  pinkLists.forEach((list) => {
    const rteBlock = WebImporter.DOMUtils.createTable([
      ['RTE V2 (bullet-pink)'],
      [list.cloneNode(true)],
    ], document);

    list.replaceWith(rteBlock);
  });
};

// Places a standard data table inside a single-cell RTE V2 block
const buildTableInsideRteBlock = (main, document) => {
  const sourceTables = [...main.querySelectorAll('table')];

  sourceTables.forEach((table) => {
    if (table.querySelectorAll('tr').length === 0) {
      table.remove();
      return;
    }

    const blockRows = [
      ['RTE V2'],
      [table.cloneNode(true)],
    ];

    const rteBlock = WebImporter.DOMUtils.createTable(blockRows, document);
    table.replaceWith(rteBlock);
  });
};

export default {
  transformDOM: ({ document }) => {
    const main = selectContentRoot(document);

    // Convert native <section> tags to <div> to prevent unwanted '---' breaks
    [...main.querySelectorAll('section')].forEach((sec) => {
      const div = document.createElement('div');
      div.className = sec.className;
      div.id = sec.id;
      div.append(...sec.childNodes);
      sec.replaceWith(div);
    });

    fixMalformedHeadings(main);
    cleanHeadingFormatting(main);
    removeGlobalNoise(main);

    buildTableInsideRteBlock(main, document);

    buildHeroBanner(main, document);
    createEmbedBlocks(main, document);
    buildInsuranceSectionsBlocks(main, document);
    appendFaqAccordion(main, document);
    buildPinkBulletRteBlocks(main, document);
    buildProfileCards(main, document);
    formatBookmarks(main, document);

    appendKotakPromos(main, document);
    appendDisclaimerAccordion(main, document);
    appendPopularSearches(main, document);

    appendMetadataBlockAtBottom(main, document);

    return main;
  },

  generateDocumentPath: ({ url, params }) => {
    const pathname = getPathname(params?.originalURL || url);
    const documentPath = pathname === '/' ? '/index' : pathname.replace(/\/$/, '');
    return WebImporter.FileUtils.sanitizePath(documentPath);
  },
};

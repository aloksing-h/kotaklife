import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Formats a stat item into value and label spans
 * @param {HTMLElement} element
 * @returns {HTMLLIElement}
 */
function createStatItem(element) {
  const li = document.createElement('li');
  li.className = 'banner-v2-stat';
  moveInstrumentation(element, li);

  const strong = element.querySelector('strong, b');
  const innerHTML = element.innerHTML.trim();

  if (innerHTML.includes('<br') || innerHTML.includes('<BR')) {
    const parts = innerHTML.split(/<br\s*\/?>/i);
    const valueSpan = document.createElement('span');
    valueSpan.className = 'stat-value';
    valueSpan.innerHTML = parts[0].trim();

    const labelSpan = document.createElement('span');
    labelSpan.className = 'stat-label';
    labelSpan.innerHTML = parts.slice(1).join(' ').trim();

    li.appendChild(valueSpan);
    li.appendChild(labelSpan);
  } else if (strong) {
    const valueSpan = document.createElement('span');
    valueSpan.className = 'stat-value';
    valueSpan.innerHTML = strong.innerHTML;

    const labelSpan = document.createElement('span');
    labelSpan.className = 'stat-label';

    const childNodes = [...element.childNodes];
    childNodes.forEach((node) => {
      if (node !== strong) {
        labelSpan.appendChild(node.cloneNode(true));
      }
    });

    li.appendChild(valueSpan);
    li.appendChild(labelSpan);
  } else {
    const text = element.textContent.trim();
    const parts = text.split(/\s+-\s+|\n/);
    if (parts.length > 1) {
      const valueSpan = document.createElement('span');
      valueSpan.className = 'stat-value';
      valueSpan.textContent = parts[0].trim();

      const labelSpan = document.createElement('span');
      labelSpan.className = 'stat-label';
      labelSpan.textContent = parts.slice(1).join(' ').trim();

      li.appendChild(valueSpan);
      li.appendChild(labelSpan);
    } else {
      const valueSpan = document.createElement('span');
      valueSpan.className = 'stat-value';
      valueSpan.textContent = text;
      li.appendChild(valueSpan);
    }
  }

  return li;
}

/**
 * Decorates the banner-v2 block
 * @param {Element} block The banner-v2 block element
 */
export default async function decorate(block) {
  // Collect all picture elements in the block
  const pictures = [...block.querySelectorAll('picture')];

  let desktopBgPicture = null;
  let mobileBgPicture = null;
  let personPicture = null;

  if (pictures.length >= 3) {
    // 3 images: [Desktop BG, Mobile BG, Person Image]
    [desktopBgPicture, mobileBgPicture, personPicture] = pictures;
  } else if (pictures.length === 2) {
    // 2 images: [Desktop BG, Person Image]
    [desktopBgPicture, personPicture] = pictures;
  } else if (pictures.length === 1) {
    // 1 image: Only Person Image (default theme gradient is used)
    [personPicture] = pictures;
  }

  // 1. Prepare background layer using clean DOM picture elements (zero inline styles on div!)
  let bgWrapper = null;
  if (desktopBgPicture || mobileBgPicture) {
    block.classList.add('has-custom-bg');
    bgWrapper = document.createElement('div');
    bgWrapper.className = 'banner-v2-bg';

    if (desktopBgPicture && mobileBgPicture) {
      const desktopBg = document.createElement('div');
      desktopBg.className = 'banner-v2-bg-desktop';
      const p1 = desktopBgPicture.parentElement;
      if (p1 && (p1.tagName === 'P' || p1.tagName === 'DIV')) {
        moveInstrumentation(p1, desktopBg);
      }
      desktopBg.appendChild(desktopBgPicture);

      const mobileBg = document.createElement('div');
      mobileBg.className = 'banner-v2-bg-mobile';
      const p2 = mobileBgPicture.parentElement;
      if (p2 && (p2.tagName === 'P' || p2.tagName === 'DIV')) {
        moveInstrumentation(p2, mobileBg);
      }
      mobileBg.appendChild(mobileBgPicture);

      bgWrapper.append(desktopBg, mobileBg);
    } else if (desktopBgPicture) {
      const desktopBg = document.createElement('div');
      desktopBg.className = 'banner-v2-bg-desktop banner-v2-bg-single';
      const p1 = desktopBgPicture.parentElement;
      if (p1 && (p1.tagName === 'P' || p1.tagName === 'DIV')) {
        moveInstrumentation(p1, desktopBg);
      }
      desktopBg.appendChild(desktopBgPicture);
      bgWrapper.appendChild(desktopBg);
    }
  }

  // Create content wrapper
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'banner-v2-content';

  // Process text elements and rows
  const rows = [...block.children];
  const headings = [];
  const descriptions = [];
  const statItems = [];

  rows.forEach((row) => {
    // Only transfer row-level instrumentation for text content rows
    if (!row.querySelector('picture')) {
      moveInstrumentation(row, contentWrapper);
    }

    // Extract headings
    row.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
      headings.push(h);
    });

    // Extract lists (if authored as ul/ol)
    row.querySelectorAll('ul > li, ol > li').forEach((li) => {
      statItems.push(li);
    });

    // Extract paragraphs (if not part of picture-only containers)
    row.querySelectorAll('p').forEach((p) => {
      if (p.querySelector('picture') && p.textContent.trim() === '') {
        return;
      }
      if (!p.textContent.trim()) {
        return;
      }

      // If paragraph contains <br> or comes after the main description, treat as stat item
      const isBrStat = p.innerHTML.includes('<br') || p.innerHTML.includes('<BR');
      if (isBrStat || descriptions.length >= 1) {
        statItems.push(p);
      } else {
        descriptions.push(p);
      }
    });
  });

  // Append headings
  headings.forEach((h) => {
    h.classList.add('banner-v2-title');
    contentWrapper.appendChild(h);
  });

  // Append description
  descriptions.forEach((p) => {
    p.classList.add('banner-v2-description');
    contentWrapper.appendChild(p);
  });

  // Append stats as an unordered list
  if (statItems.length > 0) {
    const statsList = document.createElement('ul');
    statsList.className = 'banner-v2-stats';
    statItems.forEach((item) => {
      const statLi = createStatItem(item);
      statsList.appendChild(statLi);
    });
    contentWrapper.appendChild(statsList);
  }

  // Prepare person visual wrapper
  let visualWrapper = null;
  if (personPicture) {
    visualWrapper = document.createElement('div');
    visualWrapper.className = 'banner-v2-visual';
    const parent = personPicture.parentElement;
    if (parent && parent.tagName === 'P') {
      moveInstrumentation(parent, visualWrapper);
    }
    visualWrapper.appendChild(personPicture);
  }

  // Prepare centered 1200px inner container (confines content + visual to 1200px)
  const innerWrapper = document.createElement('div');
  innerWrapper.className = 'banner-v2-inner';
  if (contentWrapper.children.length > 0) {
    innerWrapper.appendChild(contentWrapper);
  }
  if (visualWrapper) {
    innerWrapper.appendChild(visualWrapper);
  }

  // Re-assemble block cleanly with zero empty blocks or DOM conflicts
  block.replaceChildren();
  if (bgWrapper) {
    block.appendChild(bgWrapper);
  }
  block.appendChild(innerWrapper);
}

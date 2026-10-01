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
  if (window.self !== window.top) {
    block.classList.add('is-editor');
  }

  // Set section background CSS variables if defined in section dataset
  const section = block.closest('.section');
  if (section) {
    const desktopBg = section.dataset.backgroundImage;
    const mobileBg = section.dataset.backgroundimageMobile;
    if (desktopBg) {
      section.style.setProperty('--section-bg-desktop', `url('${desktopBg}')`);
    }
    if (mobileBg) {
      section.style.setProperty('--section-bg-mobile', `url('${mobileBg}')`);
    }
  }

  // Collect visual pictures authored in the block
  const pictures = [...block.querySelectorAll('picture')];

  let desktopVisual = null;
  let mobileVisual = null;

  if (pictures.length >= 2) {
    [desktopVisual, mobileVisual] = pictures;
  } else if (pictures.length === 1) {
    [desktopVisual] = pictures;
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

  // Prepare visual wrapper (Desktop & Mobile)
  let visualWrapper = null;
  if (desktopVisual || mobileVisual) {
    visualWrapper = document.createElement('div');
    visualWrapper.className = 'banner-v2-visual';

    if (desktopVisual && mobileVisual) {
      const deskContainer = document.createElement('div');
      deskContainer.className = 'banner-v2-visual-desktop';
      const p1 = desktopVisual.parentElement;
      if (p1 && (p1.tagName === 'P' || p1.tagName === 'DIV')) {
        moveInstrumentation(p1, deskContainer);
      }
      deskContainer.appendChild(desktopVisual);

      const mobContainer = document.createElement('div');
      mobContainer.className = 'banner-v2-visual-mobile';
      const p2 = mobileVisual.parentElement;
      if (p2 && (p2.tagName === 'P' || p2.tagName === 'DIV')) {
        moveInstrumentation(p2, mobContainer);
      }
      mobContainer.appendChild(mobileVisual);

      visualWrapper.append(deskContainer, mobContainer);
    } else if (desktopVisual) {
      const deskContainer = document.createElement('div');
      deskContainer.className = 'banner-v2-visual-desktop banner-v2-visual-single';
      const p1 = desktopVisual.parentElement;
      if (p1 && (p1.tagName === 'P' || p1.tagName === 'DIV')) {
        moveInstrumentation(p1, deskContainer);
      }
      deskContainer.appendChild(desktopVisual);

      visualWrapper.appendChild(deskContainer);
    }
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

  // Re-assemble block cleanly
  block.replaceChildren(innerWrapper);
}

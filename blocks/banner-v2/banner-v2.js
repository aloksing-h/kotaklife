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

  // Helper to extract clean image URL from picture
  const getImageUrl = (pic) => {
    const img = pic.querySelector('img');
    return img ? (img.currentSrc || img.src) : '';
  };

  let personPicture = null;

  if (pictures.length >= 3) {
    // 3 images: [Desktop BG, Mobile BG, Person Image]
    const desktopBgUrl = getImageUrl(pictures[0]);
    const mobileBgUrl = getImageUrl(pictures[1]);
    [, , personPicture] = pictures;

    if (desktopBgUrl) {
      block.style.setProperty('--banner-v2-bg-desktop', `url("${desktopBgUrl}")`);
      block.classList.add('has-custom-bg');
    }
    if (mobileBgUrl) {
      block.style.setProperty('--banner-v2-bg-mobile', `url("${mobileBgUrl}")`);
      block.classList.add('has-custom-bg');
    }

    // Remove background picture elements from DOM to avoid extra blocks
    pictures[0].remove();
    pictures[1].remove();
  } else if (pictures.length === 2) {
    // 2 images: [Desktop BG, Person Image]
    const desktopBgUrl = getImageUrl(pictures[0]);
    [, personPicture] = pictures;

    if (desktopBgUrl) {
      block.style.setProperty('--banner-v2-bg-desktop', `url("${desktopBgUrl}")`);
      block.classList.add('has-custom-bg');
    }

    // Remove desktop background picture element
    pictures[0].remove();
  } else if (pictures.length === 1) {
    // 1 image: Only Person Image (default theme gradient is used)
    [personPicture] = pictures;
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
    // Check if row has instrumentation attributes
    moveInstrumentation(row, contentWrapper);

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

  // Re-assemble block cleanly with zero empty blocks or DOM conflicts
  block.replaceChildren();
  if (contentWrapper.children.length > 0) {
    block.appendChild(contentWrapper);
  }
  if (visualWrapper) {
    block.appendChild(visualWrapper);
  }
}

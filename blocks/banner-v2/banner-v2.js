import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Extracts and formats stats list items
 * @param {HTMLUListElement|HTMLOListElement} list
 */
function decorateStats(list) {
  list.classList.add('banner-v2-stats');
  [...list.children].forEach((li) => {
    li.classList.add('banner-v2-stat');
    const strong = li.querySelector('strong, b');
    if (strong) {
      const valueSpan = document.createElement('span');
      valueSpan.className = 'stat-value';
      valueSpan.innerHTML = strong.innerHTML;

      const labelSpan = document.createElement('span');
      labelSpan.className = 'stat-label';

      // Clone child nodes except the strong element to build label
      const childNodes = [...li.childNodes];
      childNodes.forEach((node) => {
        if (node !== strong) {
          labelSpan.appendChild(node.cloneNode(true));
        }
      });

      li.replaceChildren(valueSpan, labelSpan);
    } else {
      const text = li.textContent.trim();
      const parts = text.split(/\s+-\s+|\n/);
      if (parts.length > 1) {
        const valueSpan = document.createElement('span');
        valueSpan.className = 'stat-value';
        valueSpan.textContent = parts[0].trim();

        const labelSpan = document.createElement('span');
        labelSpan.className = 'stat-label';
        labelSpan.textContent = parts.slice(1).join(' ').trim();

        li.replaceChildren(valueSpan, labelSpan);
      }
    }
  });
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
  rows.forEach((row) => {
    // Check if row has instrumentation attributes
    moveInstrumentation(row, contentWrapper);

    // Extract headings, paragraphs, lists
    const headings = row.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach((h) => {
      h.classList.add('banner-v2-title');
      contentWrapper.appendChild(h);
    });

    const paragraphs = row.querySelectorAll('p');
    paragraphs.forEach((p) => {
      // Avoid paragraphs that only contain picture elements
      if (p.querySelector('picture') && p.textContent.trim() === '') {
        return;
      }
      if (p.textContent.trim()) {
        p.classList.add('banner-v2-description');
        contentWrapper.appendChild(p);
      }
    });

    const lists = row.querySelectorAll('ul, ol');
    lists.forEach((list) => {
      decorateStats(list);
      contentWrapper.appendChild(list);
    });
  });

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

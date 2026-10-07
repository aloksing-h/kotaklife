import { moveInstrumentation } from '../../scripts/scripts.js';
import { decorateIcons } from '../../scripts/aem.js';

const ICON_TOKEN = /:([\w-]+):/g;

/**
 * Builds a CTA button from a paragraph like
 * `Check Premium :right-red-filled: :right-black-filled:`.
 * The first icon is the default one, the second is shown on hover.
 * @param {HTMLElement} p
 * @returns {HTMLAnchorElement}
 */
function createCta(p) {
  const link = p.querySelector('a[href]');
  const clone = p.cloneNode(true);
  clone.querySelectorAll('span.icon').forEach((span) => {
    const cls = [...span.classList].find((c) => c.startsWith('icon-'));
    span.replaceWith(cls ? `:${cls.substring(5)}:` : '');
  });
  const text = clone.textContent;
  const icons = [...text.matchAll(ICON_TOKEN)].map((m) => m[1]);
  const label = text.replace(ICON_TOKEN, '').replace(/[\s:]+$/, '').replace(/\s+/g, ' ').trim();

  const cta = document.createElement('a');
  cta.className = 'banner-v2-cta';
  cta.href = link?.getAttribute('href') || '#';
  if (link?.title) cta.title = link.title;
  moveInstrumentation(p, cta);

  const labelSpan = document.createElement('span');
  labelSpan.className = 'banner-v2-cta-label';
  labelSpan.textContent = label;

  const iconWrap = document.createElement('span');
  iconWrap.className = 'banner-v2-cta-icon';
  [icons[0] || 'right-red-filled', icons[1] || icons[0] || 'right-black-filled'].forEach((name) => {
    const icon = document.createElement('span');
    icon.className = `icon icon-${name}`;
    iconWrap.append(icon);
  });
  decorateIcons(iconWrap);

  cta.append(labelSpan, iconWrap);
  return cta;
}

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
 * Optimizes a background image URL to use AEM's modern webply format and target width.
 * @param {string} url The authored image URL
 * @param {string} [width] Target width (e.g. '2000' for desktop, '750' for mobile)
 * @returns {string} The optimized URL requesting webply format
 */
function getOptimizedBgUrl(url, width = '750') {
  if (!url) return '';
  try {
    const parsed = new URL(url, window.location.href);
    parsed.searchParams.set('format', 'webply');
    parsed.searchParams.set('optimize', 'medium');
    if (width) parsed.searchParams.set('width', width);
    return parsed.href;
  } catch {
    let optUrl = url.replace(/format=[a-z0-9]+/i, 'format=webply');
    if (!optUrl.includes('format=webply')) {
      const sep = optUrl.includes('?') ? '&' : '?';
      optUrl += `${sep}format=webply&optimize=medium`;
    }
    if (width && optUrl.includes('width=')) {
      optUrl = optUrl.replace(/width=\d+/i, `width=${width}`);
    }
    return optUrl;
  }
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
      section.style.setProperty('--section-bg-desktop', `url('${getOptimizedBgUrl(desktopBg, '2000')}')`);
    }
    if (mobileBg) {
      section.style.setProperty('--section-bg-mobile', `url('${getOptimizedBgUrl(mobileBg, '750')}')`);
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
  const ctaItems = [];

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
      const isCta = !isBrStat && descriptions.length >= 1
        && (p.querySelector('a, span.icon') || /:[\w-]+:/.test(p.textContent));
      if (isCta) {
        ctaItems.push(p);
      } else if (isBrStat || descriptions.length >= 1) {
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

  ctaItems.forEach((p) => contentWrapper.appendChild(createCta(p)));

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

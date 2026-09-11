import { decorateIcons } from '../../scripts/aem.js';
import { div, span } from '../../scripts/dom-helpers.js';

/**
 * Decorates the custom-cards block for AEM Edge Delivery Services
 * @param {Element} block The custom-cards block element
 */
export default async function decorate(block) {
  const ul = block.querySelector('ul');
  if (!ul) return;

  const isBanner = block.closest('.custom-cards-wrapper')?.previousElementSibling?.classList.contains('search-wrapper');

  if (isBanner) {
    block.classList.add('custom-cards-banner');
    const li = ul.querySelector('li');
    if (!li) return;

    // Structure banner content for layout overlay
    const body = li.querySelector('.custom-cards-card-body');
    const imageContainer = li.querySelector('.custom-cards-card-image');

    if (body) {
      // Inject key metrics overlay above image for commerce proof points
      const statsOverlay = div(
        { class: 'banner-stats' },
        div({ class: 'stat-item' }, span({ class: 'stat-value' }, '27.6%'), span({ class: 'stat-label' }, 'Growth')),
        div({ class: 'stat-item' }, span({ class: 'stat-value' }, '99.5%'), span({ class: 'stat-label' }, 'Claim Settlement Ratio')),
      );

      if (imageContainer) {
        imageContainer.append(statsOverlay);
      }
    }
  } else {
    block.classList.add('custom-cards-grid');

    // Process category items
    [...ul.children].forEach((li) => {
      const body = li.querySelector('.custom-cards-card-body');
      const arrowSpan = body?.querySelector('.icon-red-arrow-up-right');

      // Move top-right action icon to top container level if present
      if (arrowSpan && body) {
        li.appendChild(arrowSpan.cloneNode(true));
        arrowSpan.remove();
      }
    });
  }

  decorateIcons(block);
}

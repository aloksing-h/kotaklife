import { decorateIcons } from '../../scripts/aem.js';
import { div } from '../../scripts/dom-helpers.js';
/**
 * Decorates the custom-cards block for AEM Edge Delivery Services
 * @param {Element} block The custom-cards block element
 */
export default async function decorate(block) {
  const section = block.closest('.looking-for');
  const wrapper = block.closest('.custom-cards-wrapper');

  if (!section || !wrapper) return;

  const isBannerWrapper = wrapper.previousElementSibling?.classList.contains('search-wrapper');

  if (isBannerWrapper) {
    wrapper.classList.add('looking-banner');
  }

  const isBanner = block.closest('.looking-banner');
  if (!isBanner) return;

  const cardLi = block.querySelector('ul > li');
  if (!cardLi) return;

  const cardBody = cardLi.querySelector('.custom-cards-card-body');
  const cardImage = cardLi.querySelector('.custom-cards-card-image');

  if (cardBody && cardImage) {
    // 2. Wrap CTA link and Disclaimer for inline desktop layout
    const ctaParagraph = cardBody.querySelector('p:has(a)');
    const disclaimerParagraph = cardBody.querySelector('p:nth-child(3)');

    if (ctaParagraph && disclaimerParagraph) {
      const ctaGroup = div({ class: 'banner-cta-group' }, ctaParagraph, disclaimerParagraph);
      cardBody.appendChild(ctaGroup);
    }
  }

  decorateIcons(block);
}

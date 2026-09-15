import { decorateIcons } from '../../scripts/aem.js';
import { div } from '../../scripts/dom-helpers.js';

async function initBannerSwiper(block) {
  const ul = block.querySelector('ul');
  if (!ul || block.swiperInstance) return;

  const { default: createSwiper } = await import('../swiper/swiper-bundle.min.js');

  let pagination = block.querySelector('.swiper-pagination');
  if (!pagination) {
    pagination = document.createElement('div');
    pagination.className = 'swiper-pagination custom-cards-pagination';
    block.append(pagination);
  }

  block.classList.add('swiper');
  ul.classList.add('swiper-wrapper');
  [...ul.children].forEach((li) => li.classList.add('swiper-slide'));

  block.swiperInstance = createSwiper(block, {
    slidesPerView: 1,
    spaceBetween: 0,
    grabCursor: true,
    pagination: {
      el: pagination,
      clickable: true,
    },
  });
}
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

  const cardItems = block.querySelectorAll('ul > li');

  cardItems.forEach((cardLi) => {
    const cardBody = cardLi.querySelector('.custom-cards-card-body');
    const cardImage = cardLi.querySelector('.custom-cards-card-image');

    if (!cardBody || !cardImage || cardBody.querySelector('.banner-cta-group')) return;

    // Wrap CTA link and disclaimer for each banner card.
    const ctaParagraph = cardBody.querySelector('p:has(a)');
    const disclaimerParagraph = cardBody.querySelector('p:nth-child(3)');

    if (ctaParagraph && disclaimerParagraph) {
      const ctaGroup = div({ class: 'banner-cta-group' }, ctaParagraph, disclaimerParagraph);
      cardBody.appendChild(ctaGroup);
    }
  });

  decorateIcons(block);

  await initBannerSwiper(block);
}

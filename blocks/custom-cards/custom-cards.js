import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import bannerDecorate from './looking-for.js';
import decorateInfiniteProtection from './infinite-protection.js';
import initInsightsSwiper from './insights-impact-plans.js';
import initValuesSwiper from './values-cards.js';
import initdifferenceSwiper from './difference-cards.js';

/**
 * Initializes Swiper instance for mobile viewports (< 900px)
 * @param {Element} block The custom-cards block element
 */

export default async function decorate(block) {
  const differenceCardsSection = block.closest('.difference-cards');
  const valuesCardsSection = block.closest('.values-cards-hover');
  const section = block.closest('.insights-impact-plans');
  // const codeBase = window.hlx?.codeBasePath || '';

  /* Transform row structure to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);

    [...li.children].forEach((div, i) => {
      if (i === 0) {
        div.className = 'custom-cards-card-image';

        // Extract variations authored via col1_classes and apply to li
        [...div.classList].forEach((cls) => {
          if (['featured', 'horizontal', 'image-overlay'].includes(cls)) {
            li.classList.add(cls);
          }
        });

        // Process and optimize primary and secondary pictures
        const pictures = [...div.querySelectorAll('picture')];
        pictures.forEach((pic, index) => {
          const img = pic.querySelector('img');
          if (img) {
            const optimizedPic = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '750' }]);
            optimizedPic.classList.add(index === 0 ? 'primary-image' : 'secondary-image');
            pic.replaceWith(optimizedPic);
          }
        });
      } else {
        div.className = 'custom-cards-card-body';
      }
    });
    ul.append(li);
  });

  block.textContent = '';
  block.append(ul);

  await bannerDecorate(block);

  if (block.closest('.infinite-protection')) {
    await decorateInfiniteProtection(block);
  }

  // Initialize Swiper after DOM setup
  if (section) {
    initInsightsSwiper(block);
  }
  if(differenceCardsSection){
    initdifferenceSwiper(block);
  }
  if (valuesCardsSection ) {
    initValuesSwiper(block);
  }
}

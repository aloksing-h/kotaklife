import { createOptimizedPicture, loadCSS } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Initializes Swiper instance for mobile viewports (< 900px)
 * @param {Element} block The custom-cards block element
 * @param {Function} createSwiper Swiper factory function
 */
function initInsightsSwiper(block, createSwiper) {
  const ul = block.querySelector('ul');
  if (!ul) return;

  // Create pagination container if it doesn't exist
  let pagination = block.querySelector('.swiper-pagination');
  if (!pagination) {
    pagination = document.createElement('div');
    pagination.className = 'swiper-pagination';
    block.append(pagination);
  }

  const mobileQuery = window.matchMedia('(max-width: 899px)');

  const enableSwiper = () => {
    if (!block.clientWidth) {
      setTimeout(enableSwiper, 50);
      return;
    }

    if (!block.swiperInstance && createSwiper) {
      block.classList.add('swiper');
      ul.classList.add('swiper-wrapper');
      [...ul.children].forEach((li) => li.classList.add('swiper-slide'));

      block.swiperInstance = createSwiper(block, {
        slidesPerView: 1.22,
        spaceBetween: 8,
        grabCursor: true,
        pagination: {
          el: pagination,
          clickable: true,
        }
      });
    }
  };

  const disableSwiper = () => {
    if (block.swiperInstance) {
      block.swiperInstance.destroy(true, true);
      block.swiperInstance = null;
      block.classList.remove('swiper', 'swiper-initialized', 'swiper-horizontal', 'swiper-backface-hidden');
      ul.classList.remove('swiper-wrapper');
      [...ul.children].forEach((li) => li.classList.remove('swiper-slide'));
      pagination.className = 'swiper-pagination';
      pagination.textContent = '';
    }
  };

  const handleMediaChange = () => {
    if (mobileQuery.matches) {
      enableSwiper();
    } else {
      disableSwiper();
    }
  };

  handleMediaChange();
  mobileQuery.addEventListener('change', handleMediaChange);
}

export default async function decorate(block) {
  const section = block.closest('.insights-impact-plans');
  const codeBase = window.hlx?.codeBasePath || '';
  let createSwiper;

  // Load Swiper CSS and JS at top level if block is inside .insights-impact-plans
  if (section) {
    const [{ default: swiperFactory }] = await Promise.all([
      import(`${codeBase}/blocks/swiper/swiper-bundle.min.js`),
      loadCSS(`${codeBase}/blocks/swiper/swiper-bundle.min.css`),
    ]);
    createSwiper = swiperFactory;
  }

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

  // Initialize Swiper after DOM setup
  if (section) {
    initInsightsSwiper(block, createSwiper);
  }
}

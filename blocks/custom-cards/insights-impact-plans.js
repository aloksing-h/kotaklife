export default async function initInsightsSwiper(block) {
  const ul = block.querySelector('ul');
  if (!ul) return;

  const { default: createSwiper } = await import('../swiper/swiper-bundle.min.js');
  // Create pagination container if it doesn't exist
  let pagination = block.querySelector('.swiper-pagination');
  if (!pagination) {
    pagination = document.createElement('div');
    pagination.className = 'swiper-pagination';
    block.append(pagination);
  }

  const mobileQuery = window.matchMedia('(max-width: 768px)');

  const enableSwiper = () => {
    if (!block.swiperInstance) {
      block.classList.add('swiper');
      ul.classList.add('swiper-wrapper');
      [...ul.children].forEach((li) => li.classList.add('swiper-slide'));

      block.swiperInstance = createSwiper(block, {
        slidesPerView: 'auto',
        spaceBetween: 8,
        grabCursor: true,
        pagination: {
          el: pagination,
          clickable: true,
        },
        on: {
          click(swiper) {
            // Ensure clickedIndex is valid and numeric before sliding
            if (typeof swiper.clickedIndex === 'number' && !Number.isNaN(swiper.clickedIndex)) {
              swiper.slideTo(swiper.clickedIndex);
            }
          },
        },
        breakpoints: {
          768: {
            spaceBetween: 16, // Spacing for screens 768px and above
          },
        },
      });
    }
  };

  const disableSwiper = () => {
    if (block.swiperInstance) {
      block.swiperInstance.destroy(true, true);
      block.swiperInstance = null;
      block.classList.remove('swiper');
      ul.classList.remove('swiper-wrapper');
      [...ul.children].forEach((li) => li.classList.remove('swiper-slide'));
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

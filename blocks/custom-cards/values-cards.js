export default async function initValuesSwiper(block, differenceCardsSection, valuesCardsSection) {
  const ul = block.querySelector('ul');
  if (!ul) return;

  // Create pagination container if it doesn't exist
  let pagination = block.querySelector('.swiper-pagination');
  if (!pagination) {
    pagination = document.createElement('div');
    pagination.className = 'swiper-pagination';
    block.append(pagination);
  }

  let mobileQuery = window.matchMedia('(max-width: 768px)'); // Default fallback

  if (differenceCardsSection) {
    mobileQuery = window.matchMedia('(max-width: 768px)');
  } else if (valuesCardsSection) {
    mobileQuery = window.matchMedia('(max-width: 800px)');
  }

  const enableSwiper = async () => {
    if (!block.swiperInstance) {
      // 1. Add classes BEFORE initializing so Swiper finds them
      block.classList.add('swiper');
      ul.classList.add('swiper-wrapper');
      [...ul.children].forEach((li) => li.classList.add('swiper-slide'));

      try {
        // 2. Dynamically import Swiper ONLY when on mobile
        const { default: createSwiper } = await import('../swiper/swiper-bundle.min.js');

        // 3. Define the base/default Swiper configuration
        let swiperConfig = {
          slidesPerView: 'auto',
          spaceBetween: 8,
          grabCursor: true,
          pagination: {
            el: pagination,
            clickable: true,
          },
        };

        // 4. Override configuration if valuesCardsSection is true
        if (valuesCardsSection) {
          swiperConfig = {
            ...swiperConfig, // Inherit the base settings (like pagination)
            slidesPerView: 'auto', // YOUR NEW CONFIG HERE (Example: 1.2 slides)
            spaceBetween: 12, // YOUR NEW CONFIG HERE (Example: 16px space)
          };
        }

        block.swiperInstance = createSwiper(block, swiperConfig);
      } catch (error) {
        throw new Error('Failed to load Swiper', { cause: error });
      }
    }
  };

  const disableSwiper = () => {
    if (block.swiperInstance) {
      block.swiperInstance.destroy(true, true);
      block.swiperInstance = null;
    }
    // 3. Always ensure classes are stripped on desktop
    block.classList.remove('swiper');
    ul.classList.remove('swiper-wrapper');
    [...ul.children].forEach((li) => li.classList.remove('swiper-slide'));
  };

  const handleMediaChange = (e) => {
    if (e.matches) {
      enableSwiper();
    } else {
      disableSwiper();
    }
  };

  // Initial check on page load
  handleMediaChange(mobileQuery);

  // Listen for window resize
  mobileQuery.addEventListener('change', handleMediaChange);
}

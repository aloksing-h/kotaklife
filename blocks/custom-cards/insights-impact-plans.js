export default async function initInsightsSwiper(block) {
  const ul = block.querySelector('ul');
  if (!ul) return;

  const cards = [...ul.children];

  // Click handler: clicking a card toggles it active and deactivates others
  cards.forEach((card, index) => {
    card.addEventListener('click', () => {
      const wasActive = card.classList.contains('is-active-card');
      cards.forEach((c) => c.classList.remove('is-active-card'));
      if (!wasActive) {
        card.classList.add('is-active-card');
      }
      if (block.swiperInstance) {
        block.swiperInstance.slideTo(index);
      }
    });
  });

  // Click outside handler: clicking anywhere outside cards removes the active state
  document.addEventListener('click', (e) => {
    const clickedCard = e.target.closest('.insights-impact-plans .custom-cards > ul > li');
    if (!clickedCard || !ul.contains(clickedCard)) {
      cards.forEach((c) => c.classList.remove('is-active-card'));
    }
  });

  // Create pagination container if it doesn't exist
  let pagination = block.querySelector('.swiper-pagination');
  if (!pagination) {
    pagination = document.createElement('div');
    pagination.className = 'swiper-pagination';
    block.append(pagination);
  }

  // Mobile breakpoint: below tablet (< 600px)
  const mobileQuery = window.matchMedia('(max-width: 599px)');

  let isInitializingSwiper = false;
  let userSwiped = false;

  const enableSwiper = async () => {
    if (!block.swiperInstance && !isInitializingSwiper) {
      isInitializingSwiper = true;
      block.classList.add('swiper');
      ul.classList.add('swiper-wrapper');
      cards.forEach((li) => li.classList.add('swiper-slide'));

      try {
        const { default: createSwiper } = await import('../swiper/swiper-bundle.min.js');

        // Verify media query still matches after async import
        if (!mobileQuery.matches) {
          block.classList.remove('swiper');
          ul.classList.remove('swiper-wrapper');
          cards.forEach((li) => li.classList.remove('swiper-slide'));
          isInitializingSwiper = false;
          return;
        }

        block.swiperInstance = createSwiper(block, {
          slidesPerView: 'auto',
          spaceBetween: 8,
          grabCursor: true,
          centeredSlides: true,
          centeredSlidesBounds: true,
          slideToClickedSlide: true,
          slidesOffsetBefore: 16,
          slidesOffsetAfter: 16,
          pagination: {
            el: pagination,
            clickable: true,
          },
          on: {
            click(swiper) {
              if (typeof swiper.clickedIndex === 'number' && !Number.isNaN(swiper.clickedIndex)) {
                swiper.slideTo(swiper.clickedIndex);
              }
            },
            sliderMove() {
              userSwiped = true;
              cards.forEach((slide) => slide.classList.remove('is-active-card'));
            },
            slideChange() {
              if (userSwiped) {
                cards.forEach((slide) => slide.classList.remove('is-active-card'));
                userSwiped = false;
              }
            },
            touchEnd() {
              setTimeout(() => {
                userSwiped = false;
              }, 100);
            },
          },
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to initialize Insights Swiper', err);
      } finally {
        isInitializingSwiper = false;
      }
    }
  };

  const disableSwiper = () => {
    if (block.swiperInstance) {
      block.swiperInstance.destroy(true, true);
      block.swiperInstance = null;
    }
    block.classList.remove('swiper');
    ul.classList.remove('swiper-wrapper');
    cards.forEach((li) => li.classList.remove('swiper-slide'));
  };

  const handleMediaChange = (e) => {
    if (e.matches) {
      enableSwiper();
    } else {
      disableSwiper();
    }
  };

  handleMediaChange(mobileQuery);
  mobileQuery.addEventListener('change', handleMediaChange);
}

export default async function decorateInfiniteProtection(block) {
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
    spaceBetween: 18,
    grabCursor: true,
    pagination: {
      el: pagination,
      clickable: true,
    },
    breakpoints: {
      900: {
        slidesPerView: 1,
        spaceBetween: 28,
      },
      1200: {
        slidesPerView: 1,
        spaceBetween: 32,
      },
    },
  });
}

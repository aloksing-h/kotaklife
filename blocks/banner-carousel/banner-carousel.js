import { moveInstrumentation } from '../../scripts/scripts.js';

let carouselId = 0;

function getRowValue(row) {
  return row?.textContent.trim() || '';
}

function getRowContent(row) {
  return row?.firstElementChild || row;
}

function createTextElement(row, className) {
  const element = document.createElement('p');
  element.className = className;
  element.textContent = getRowValue(row);
  return element;
}

function createSlide(row, index, id) {
  const slide = document.createElement('li');
  slide.className = 'banner-carousel-slide';
  slide.id = `banner-carousel-${id}-slide-${index}`;
  slide.setAttribute('role', 'group');
  moveInstrumentation(row, slide);

  const fields = [...row.children];
  const desktopImage = getRowContent(fields[0]);
  const desktopAlt = getRowValue(fields[1]);
  const mobileImage = getRowContent(fields[2]);
  const mobileAlt = getRowValue(fields[3]);
  const tag = getRowValue(fields[4]);
  const title = createTextElement(fields[5], 'banner-carousel-title');
  const cta = getRowContent(fields[6]);
  const ctaText = getRowValue(fields[7]);
  const ctaIcon = getRowContent(fields[8]);
  const description = createTextElement(fields[9], 'banner-carousel-description');
  const rateOne = getRowContent(fields[10]);
  const rateTwo = getRowContent(fields[11]);
  const content = document.createElement('div');
  content.className = 'banner-carousel-content';

  if (desktopImage) {
    desktopImage.className = 'banner-carousel-image banner-carousel-image-desktop';
    const image = desktopImage.querySelector('img');
    if (image && desktopAlt) image.alt = desktopAlt;
    slide.append(desktopImage);
  }
  if (mobileImage) {
    mobileImage.className = 'banner-carousel-image banner-carousel-image-mobile';
    const image = mobileImage.querySelector('img');
    if (image && mobileAlt) image.alt = mobileAlt;
    slide.append(mobileImage);
  }

  if (tag) {
    const tagElement = document.createElement('span');
    tagElement.className = 'banner-carousel-tag';
    tagElement.textContent = tag;
    content.append(tagElement);
  }
  if (title.textContent) {
    content.append(title);
  }
  if (description.textContent) {
    content.append(description);
  }
  if (cta && ctaText) {
    cta.className = 'banner-carousel-cta';
    const link = cta.querySelector('a') || cta;
    link.textContent = ctaText;
    if (ctaIcon?.querySelector('img')) {
      ctaIcon.className = 'banner-carousel-cta-icon';
      ctaIcon.querySelector('img').alt = '';
      cta.append(ctaIcon);
    }
    content.append(cta);
  }

  const rates = [rateOne, rateTwo].filter((rate) => rate?.textContent.trim());
  if (rates.length) {
    const ratesList = document.createElement('ul');
    ratesList.className = 'banner-carousel-rates';
    rates.forEach((rateContent) => {
      const rate = document.createElement('li');
      rate.append(...rateContent.childNodes);
      ratesList.append(rate);
    });
    content.append(ratesList);
  }

  if (content.childNodes.length) slide.append(content);
  return slide;
}

export default async function decorate(block) {
  carouselId += 1;
  const rows = [...block.children];
  const slides = rows.map((row, index) => createSlide(row, index, carouselId));
  block.replaceChildren();
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  block.classList.add('swiper');

  const slideList = document.createElement('ul');
  slideList.className = 'banner-carousel-slides swiper-wrapper';
  slides.forEach((slide) => slide.classList.add('swiper-slide'));
  slideList.append(...slides);
  block.append(slideList);

  let pagination;
  if (slides.length > 1) {
    pagination = document.createElement('div');
    pagination.className = 'swiper-pagination';
    block.append(pagination);
  }

  const { default: createSwiper } = await import('../swiper/swiper-bundle.min.js');
  block.swiperInstance = createSwiper(block, {
    slidesPerView: 1,
    spaceBetween: 0,
    grabCursor: true,
    pagination: pagination && {
      el: pagination,
      clickable: true,
    },
  });
}

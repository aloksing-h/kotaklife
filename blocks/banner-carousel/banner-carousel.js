import { moveInstrumentation } from '../../scripts/scripts.js';

let carouselId = 0;

function showSlide(block, index) {
  const slides = [...block.querySelectorAll('.banner-carousel-slide')];
  const activeIndex = (index + slides.length) % slides.length;

  slides.forEach((slide, slideIndex) => {
    const isActive = slideIndex === activeIndex;
    slide.hidden = !isActive;
    slide.setAttribute('aria-hidden', String(!isActive));
  });

  block.querySelectorAll('.banner-carousel-dot').forEach((dot, dotIndex) => {
    dot.setAttribute('aria-current', dotIndex === activeIndex ? 'true' : 'false');
  });
  block.dataset.activeSlide = activeIndex;
}

function getRowValue(row) {
  return row?.textContent.trim() || '';
}

function getRowContent(row) {
  return row?.firstElementChild || row;
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
  const title = getRowContent(fields[5]);
  const description = getRowContent(fields[6]);
  const cta = getRowContent(fields[7]);
  const ctaIcon = getRowContent(fields[8]);
  const rateOne = getRowContent(fields[9]);
  const rateTwo = getRowContent(fields[10]);
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
  if (title) {
    title.className = 'banner-carousel-title';
    content.append(title);
  }
  if (description) {
    description.className = 'banner-carousel-description';
    content.append(description);
  }
  if (cta?.textContent.trim()) {
    cta.className = 'banner-carousel-cta';
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

export default function decorate(block) {
  carouselId += 1;
  const rows = [...block.children];
  const slides = rows.map((row, index) => createSlide(row, index, carouselId));
  block.replaceChildren();
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');

  const viewport = document.createElement('div');
  viewport.className = 'banner-carousel-viewport';
  const slideList = document.createElement('ul');
  slideList.className = 'banner-carousel-slides';
  slideList.append(...slides);
  viewport.append(slideList);
  block.append(viewport);

  if (slides.length > 1) {
    const controls = document.createElement('div');
    controls.className = 'banner-carousel-controls';
    controls.innerHTML = `
      <button type="button" class="banner-carousel-previous" aria-label="Previous slide"></button>
      <div class="banner-carousel-dots" role="tablist" aria-label="Carousel slides"></div>
      <button type="button" class="banner-carousel-next" aria-label="Next slide"></button>
    `;
    block.append(controls);

    const dots = controls.querySelector('.banner-carousel-dots');
    slides.forEach((slide, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'banner-carousel-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Show slide ${index + 1}`);
      dot.addEventListener('click', () => showSlide(block, index));
      dots.append(dot);
    });

    controls.querySelector('.banner-carousel-previous').addEventListener('click', () => {
      showSlide(block, Number(block.dataset.activeSlide || 0) - 1);
    });
    controls.querySelector('.banner-carousel-next').addEventListener('click', () => {
      showSlide(block, Number(block.dataset.activeSlide || 0) + 1);
    });
  }

  showSlide(block, 0);
}

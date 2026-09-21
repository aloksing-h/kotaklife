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

function createSlide(row, index, id) {
  const slide = document.createElement('li');
  slide.className = 'banner-carousel-slide';
  slide.id = `banner-carousel-${id}-slide-${index}`;
  slide.setAttribute('role', 'group');
  moveInstrumentation(row, slide);

  const columns = [...row.children];
  const imageColumn = columns.shift();
  const altColumn = columns.shift();
  const content = document.createElement('div');
  content.className = 'banner-carousel-content';

  if (imageColumn) {
    imageColumn.className = 'banner-carousel-image';
    const image = imageColumn.querySelector('img');
    const alt = altColumn?.textContent.trim();
    if (image && alt) image.alt = alt;
    slide.append(imageColumn);
  }

  columns.forEach((column) => content.append(...column.childNodes));
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

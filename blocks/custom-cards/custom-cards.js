import { createOptimizedPicture, loadCSS } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const CARD_VARIATIONS = ['featured', 'horizontal', 'image-overlay'];
const mobileMedia = window.matchMedia('(max-width: 899px)');
let cardId = 0;

function optimizeImage(image) {
  const picture = createOptimizedPicture(image.src, image.alt, false, [
    { media: '(min-width: 900px)', width: '750' },
    { width: '600' },
  ]);
  moveInstrumentation(image, picture.querySelector('img'));
  image.closest('picture').replaceWith(picture);
}

function extractVariations(column, item) {
  const metadata = [...(column?.children || [])].find((element) => (
    element.tagName === 'P'
    && !element.querySelector('picture, .icon, a[href]')
    && element.textContent.trim()
  ));
  const values = metadata?.textContent
    .split(',')
    .map((value) => value.trim().toLowerCase()) || [];

  CARD_VARIATIONS.forEach((variation) => {
    if (values.includes(variation)) item.classList.add(variation);
  });
  metadata?.remove();
}

function createMedia(column) {
  const picture = column?.querySelector('picture');
  if (!picture) return null;

  const media = document.createElement('div');
  media.className = 'custom-cards-media';
  picture.classList.add('custom-cards-picture');
  media.append(picture);
  media.querySelectorAll('img').forEach(optimizeImage);
  return media;
}

function createContent(column, titleId) {
  if (!column) return null;

  const heading = column.querySelector('h1, h2, h3, h4, h5, h6');
  if (!heading) return null;

  const content = document.createElement('div');
  content.className = 'custom-cards-content';
  const badgeSource = [...column.children].find((element) => (
    element.tagName === 'P'
    && element.textContent.trim()
    && !element.querySelector('.icon, a[href]')
  ));

  if (badgeSource) {
    badgeSource.className = 'custom-cards-badge';
    content.append(badgeSource);
  }

  heading.id = titleId;
  heading.className = 'custom-cards-title';
  content.append(heading);
  [...column.children]
    .filter((element) => !element.querySelector('.icon, a[href]'))
    .forEach((element) => content.append(element));
  return content;
}

function createAction(column) {
  const icon = column?.querySelector('.icon');
  const link = column?.querySelector('a[href]');
  if (!icon && !link) return null;

  const action = document.createElement('div');
  action.className = 'custom-cards-action';
  if (!link) {
    action.append(icon);
    return action;
  }

  const label = link.textContent.trim() || 'View card details';
  link.className = 'custom-cards-action-link';
  link.setAttribute('aria-label', label);
  if (icon) link.replaceChildren(icon);
  action.append(link);
  return action;
}

function createCard(row) {
  cardId += 1;
  const columns = [...row.children];
  const legacyStructure = columns.length >= 3;
  const metadataColumn = columns[0];
  const mediaColumn = columns[legacyStructure ? 1 : 0];
  const contentColumn = columns[legacyStructure ? 2 : 1];
  const item = document.createElement('li');
  const article = document.createElement('article');
  const titleId = `custom-cards-title-${cardId}`;

  moveInstrumentation(row, item);
  extractVariations(metadataColumn, item);

  const media = createMedia(mediaColumn);
  const content = createContent(contentColumn, titleId);
  const action = createAction(contentColumn);

  if (content) article.setAttribute('aria-labelledby', titleId);
  if (media) article.append(media);
  if (content) article.append(content);
  if (action) article.append(action);
  item.append(article);
  return item;
}

async function setupSwiper(block, list) {
  let swiper;

  const updateSwiper = async () => {
    if (!mobileMedia.matches) {
      swiper?.destroy(true, true);
      swiper = null;
      block.classList.remove('swiper');
      list.classList.remove('swiper-wrapper');
      [...list.children].forEach((slide) => slide.classList.remove('swiper-slide'));
      block.querySelector('.swiper-pagination')?.remove();
      return;
    }

    if (swiper) return;
    await loadCSS(`${window.hlx.codeBasePath}/blocks/swiper/swiper-bundle.min.css`);
    const { default: createSwiper } = await import('../swiper/swiper-bundle.min.js');
    if (!mobileMedia.matches || !block.isConnected) return;

    block.classList.add('swiper');
    list.classList.add('swiper-wrapper');
    [...list.children].forEach((slide) => slide.classList.add('swiper-slide'));

    const pagination = document.createElement('div');
    pagination.className = 'swiper-pagination';
    pagination.setAttribute('aria-label', 'Card pagination');
    block.append(pagination);

    swiper = createSwiper(block, {
      slidesPerView: 'auto',
      spaceBetween: 8,
      speed: 400,
      keyboard: { enabled: true },
      pagination: {
        el: pagination,
        clickable: true,
        bulletElement: 'button',
      },
      a11y: { enabled: true },
    });
  };

  await updateSwiper();
  mobileMedia.addEventListener('change', updateSwiper);
}

export default async function decorate(block) {
  const list = document.createElement('ul');
  [...block.children].forEach((row) => list.append(createCard(row)));
  block.replaceChildren(list);
  await setupSwiper(block, list);
}

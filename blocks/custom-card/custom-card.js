import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const CARD_VARIATIONS = ['featured', 'horizontal', 'image-overlay'];
let cardId = 0;

function optimizeImage(image) {
  const picture = createOptimizedPicture(image.src, image.alt, false, [
    { media: '(min-width: 900px)', width: '750' },
    { width: '600' },
  ]);
  moveInstrumentation(image, picture.querySelector('img'));
  image.closest('picture').replaceWith(picture);
}

function createMedia(column) {
  const pictures = column ? [...column.querySelectorAll('picture')] : [];
  if (!pictures.length) return null;

  const media = document.createElement('div');
  media.className = 'custom-card-media';
  pictures.forEach((picture, index) => {
    const imageWrapper = document.createElement('div');
    imageWrapper.className = `custom-card-image custom-card-image-${index + 1}`;
    imageWrapper.append(picture);
    media.append(imageWrapper);
  });

  media.querySelectorAll('img').forEach(optimizeImage);
  return media;
}

function createContent(column, titleId) {
  if (!column) return null;

  const elements = [...column.children].filter((element) => element.textContent.trim());
  if (!elements.length) return null;

  const content = document.createElement('div');
  content.className = 'custom-card-content';

  const titleSource = elements.shift();
  const title = document.createElement('h3');
  title.id = titleId;
  title.textContent = titleSource.textContent.trim();
  content.append(title);

  elements.forEach((element) => content.append(element));
  return content;
}

function createAction(column, fallbackLabel) {
  if (!column) return null;

  const link = column.querySelector('a[href]');
  if (!link) return null;

  const values = [...column.children]
    .filter((element) => !element.contains(link))
    .map((element) => element.textContent.trim())
    .filter(Boolean);
  const label = values[0] || link.textContent.trim() || fallbackLabel;
  const accessibleTitle = values[1] || link.title || label;

  link.replaceChildren(document.createTextNode(label));
  link.className = 'custom-card-cta';
  link.title = accessibleTitle;
  link.setAttribute('aria-label', accessibleTitle);

  const action = document.createElement('div');
  action.className = 'custom-card-action';
  action.append(link);
  return action;
}

function createCard(row) {
  cardId += 1;
  const columns = [...row.children];
  const item = document.createElement('li');
  const article = document.createElement('article');
  const titleId = `custom-card-title-${cardId}`;

  moveInstrumentation(row, item);
  CARD_VARIATIONS.forEach((variation) => {
    if (row.classList.contains(variation)) item.classList.add(variation);
  });

  const media = createMedia(columns[0]);
  const content = createContent(columns[1], titleId);
  const action = createAction(columns[2], 'View card details');

  if (content?.querySelector('h3')) article.setAttribute('aria-labelledby', titleId);
  if (media) article.append(media);
  if (content) article.append(content);
  if (action) article.append(action);

  item.append(article);
  return item;
}

export default function decorate(block) {
  const list = document.createElement('ul');
  list.className = 'custom-card-list';

  [...block.children].forEach((row) => list.append(createCard(row)));
  block.replaceChildren(list);
}

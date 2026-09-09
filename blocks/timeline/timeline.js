/* global Swiper */
// eslint-disable-next-line import/no-unresolved
import { toClassName } from '../../scripts/aem.js';
// eslint-disable-next-line import/no-unresolved
import { moveInstrumentation } from '../../scripts/scripts.js';

function showYear(block, index) {
  const markers = block.querySelectorAll('.timeline-marker-btn');
  const panels = block.querySelectorAll('.timeline-panel');
  const total = markers.length;
  if (total === 0) return;
  const activeIndex = ((index % total) + total) % total;

  markers.forEach((marker, i) => {
    marker.setAttribute('aria-selected', i === activeIndex);
  });
  panels.forEach((panel, i) => {
    panel.setAttribute('aria-hidden', i !== activeIndex);
  });
  block.dataset.activeYear = activeIndex;
  markers[activeIndex].scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
}

function initSwiper(block) {
  const swiperEl = block.querySelector('.timeline-nav');
  if (!swiperEl || typeof Swiper === 'undefined') return;

  // eslint-disable-next-line no-new
  new Swiper(swiperEl, {
    slidesPerView: 'auto',
    spaceBetween: 24,
    navigation: {
      nextEl: '.timeline-arrow-next',
      prevEl: '.timeline-arrow-prev',
    },
    breakpoints: {
      600: {
        slidesPerView: 'auto',
        spaceBetween: 24,
      },
      900: {
        slidesPerView: 'auto',
        spaceBetween: 32,
      },
    },
  });
}

export default function decorate(block) {
  const items = [...block.children];
  const years = [];
  let currentYear = null;

  // Group items by year (preserve original elements for moveInstrumentation)
  items.forEach((item) => {
    const title = item.children[0];
    const cardsContainer = item.children[1];

    if (!cardsContainer) {
      const titleText = title ? title.textContent.trim() : '';
      if (!titleText) return;

      const existingYear = years.find((y) => y.title === titleText);
      if (existingYear) {
        currentYear = existingYear;
      } else {
        currentYear = { title: titleText, cards: [], originalElement: item };
        years.push(currentYear);
      }
    } else if (currentYear) {
      currentYear.cards.push(item);
    } else {
      currentYear = { title: 'Other', cards: [item], originalElement: item };
      years.push(currentYear);
    }
  });

  // Create tablist for navigation
  const tablist = document.createElement('div');
  tablist.className = 'tabs-list timeline-nav';
  tablist.setAttribute('role', 'tablist');

  // Create timeline line
  const line = document.createElement('div');
  line.className = 'timeline-line';
  tablist.append(line);

  // Create document fragment for panels
  const fragment = document.createDocumentFragment();

  years.forEach((year, i) => {
    const id = `${toClassName(year.title)}-${i}`;

    // Create tab button
    const button = document.createElement('button');
    button.className = 'tabs-tab timeline-marker-btn';
    button.id = `tab-${id}`;
    button.setAttribute('aria-controls', `tabpanel-${id}`);
    button.setAttribute('aria-selected', !i);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');
    button.addEventListener('click', () => showYear(block, i));

    const markerText = document.createElement('span');
    markerText.className = 'timeline-marker-text';
    const p = document.createElement('p');
    p.textContent = year.title;
    markerText.appendChild(p);

    const markerDot = document.createElement('span');
    markerDot.className = 'timeline-marker-dot';

    button.appendChild(markerText);
    button.appendChild(markerDot);
    tablist.append(button);

    // Create panel
    const panel = document.createElement('div');
    panel.className = 'tabs-panel timeline-panel';
    panel.id = `tabpanel-${id}`;
    panel.setAttribute('aria-hidden', !!i);
    panel.setAttribute('role', 'tabpanel');

    // Transfer instrumentation from year's original element to panel
    if (year.originalElement) {
      moveInstrumentation(year.originalElement, panel);
    }

    // Create cards container
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'timeline-cards';

    // Create cards list
    const cardsList = document.createElement('ul');
    cardsList.className = 'timeline-cards-list';

    year.cards.forEach((card) => {
      const cardItem = document.createElement('li');
      cardItem.className = 'timeline-card-item';

      // Transfer instrumentation from card to cardItem
      moveInstrumentation(card, cardItem);

      const imageContainer = card.children[0];
      const textContainer = card.children[1];

      if (imageContainer) {
        const cardImage = document.createElement('div');
        cardImage.className = 'card-image';
        // Move original elements (preserves instrumentation)
        while (imageContainer.firstElementChild) {
          cardImage.append(imageContainer.firstElementChild);
        }
        // Transfer instrumentation from imageContainer to cardImage
        moveInstrumentation(imageContainer, cardImage);
        cardItem.appendChild(cardImage);
      }

      if (textContainer) {
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';
        // Move original elements (preserves richtext instrumentation)
        while (textContainer.firstElementChild) {
          cardBody.append(textContainer.firstElementChild);
        }
        // Transfer instrumentation from textContainer to cardBody
        moveInstrumentation(textContainer, cardBody);
        cardItem.appendChild(cardBody);
      }

      cardsList.appendChild(cardItem);
    });

    cardsContainer.appendChild(cardsList);
    panel.appendChild(cardsContainer);
    fragment.appendChild(panel);
  });

  // Create navigation arrows
  const arrows = document.createElement('div');
  arrows.className = 'timeline-arrows';

  const prevIcon = document.createElement('span');
  prevIcon.className = 'icon icon-arrow_right';

  const prevButton = document.createElement('button');
  prevButton.className = 'timeline-arrow timeline-arrow-prev';
  prevButton.type = 'button';
  prevButton.setAttribute('aria-label', 'Previous year');
  prevButton.appendChild(prevIcon);
  prevButton.addEventListener('click', () => {
    const activeIndex = parseInt(block.dataset.activeYear || '0', 10);
    showYear(block, activeIndex - 1);
  });

  const nextIcon = document.createElement('span');
  nextIcon.className = 'icon icon-arrow_right';

  const nextButton = document.createElement('button');
  nextButton.className = 'timeline-arrow timeline-arrow-next';
  nextButton.type = 'button';
  nextButton.setAttribute('aria-label', 'Next year');
  nextButton.appendChild(nextIcon);
  nextButton.addEventListener('click', () => {
    const activeIndex = parseInt(block.dataset.activeYear || '0', 10);
    showYear(block, activeIndex + 1);
  });

  arrows.append(prevButton, nextButton);
  tablist.append(arrows);

  // NOW clear block and rebuild (after transferring instrumentation)
  block.innerHTML = '';
  block.prepend(tablist);
  block.append(fragment);

  // Initialize Swiper and show first year
  initSwiper(block);
  showYear(block, 0);
}

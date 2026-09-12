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

// function initSwiper(block) {
//   const swiperEl = block.querySelector('.timeline-nav');
//   if (!swiperEl) return;

//   Swiper(swiperEl, {
//     wrapperClass: 'timeline-track',
//     slideClass: 'tabs-tab',
    
//     // 2. Enable drag and scroll
//     simulateTouch: true,    // Enables mouse drag
//     grabCursor: true,       // Shows the 'grab' hand cursor
//     freeMode: true,
//     slidesPerView: 'auto',
//     spaceBetween: 67,
//     navigation: {
//       nextEl: '.timeline-arrow-next',
//       prevEl: '.timeline-arrow-prev',
//     },
//     breakpoints: {
//       900: {
//         slidesPerView: 'auto',
//         spaceBetween: 112,
//       },
//     },
//   });
// }

function initDragScroll(block) {
  // We apply the scroll to the nav container
  const slider = block.querySelector('.timeline-nav');
  if (!slider) return;

  let isDown = false;
  let startX;
  let scrollLeft;

  // Set initial cursor
  slider.style.cursor = 'grab';

  slider.addEventListener('mousedown', (e) => {
    isDown = true;
    slider.style.cursor = 'grabbing';
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
  });

  slider.addEventListener('mouseleave', () => {
    isDown = false;
    slider.style.cursor = 'grab';
  });

  slider.addEventListener('mouseup', () => {
    isDown = false;
    slider.style.cursor = 'grab';
  });

  slider.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault(); // Stop text highlighting while dragging
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 1.5; // Multiply by 1.5 to scroll a bit faster
    slider.scrollLeft = scrollLeft - walk;
  });
}

export default function decorate(block) {
  if (block.classList.contains('awards')) {
    const items = [...block.children];
    const years = [];
    let currentYear = null;

    // 1. Parse the flat authoring structure
    items.forEach((item) => {
      const firstCol = item.children[0];
      const secondCol = item.children[1];

      // Detect if this is a "Year" row (second column is missing or completely empty)
      const isYearRow = !secondCol || (secondCol.textContent.trim() === '' && secondCol.children.length === 0);

      if (isYearRow) {
        const titleText = firstCol ? firstCol.textContent.trim() : '';
        if (!titleText) return;

        currentYear = { title: titleText, cards: [], originalElement: item };
        years.push(currentYear);
      } else if (currentYear) {
        currentYear.cards.push(item);
      } else {
        // Fallback if cards are authored before any year header
        currentYear = { title: 'Other', cards: [item], originalElement: item };
        years.push(currentYear);
      }
    });

    // 2. Build the Navigation Tablist
    const tablist = document.createElement('div');
    tablist.className = 'tabs-list timeline-nav';
    tablist.setAttribute('role', 'tablist');
    const track = document.createElement('div');
    track.classList.add('timeline-track'); // New inner wrapper

    const line = document.createElement('div');
    line.className = 'timeline-line';
    track.append(line);
    tablist.append(track);

    const fragment = document.createDocumentFragment();

    // 3. Construct Panels and Cards
    years.forEach((year, i) => {
      const id = `${toClassName(year.title)}-${i}`;

      // --- Create Nav Button ---
      const button = document.createElement('button');
      button.className = 'tabs-tab timeline-marker-btn';
      button.id = `tab-${id}`;
      button.setAttribute('aria-controls', `tabpanel-${id}`);
      button.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
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
      track.append(button);

      // --- Create Panel for the Year ---
      const panel = document.createElement('div');
      panel.className = 'tabs-panel timeline-panel';
      panel.id = `tabpanel-${id}`;
      panel.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
      panel.setAttribute('role', 'tabpanel');

      // Transfer AEM instrumentation from the authored year row to the new panel
      if (year.originalElement) {
        moveInstrumentation(year.originalElement, panel);
      }

      const cardsContainer = document.createElement('div');
      cardsContainer.className = 'timeline-cards';

      const cardsList = document.createElement('ul');
      cardsList.className = 'timeline-cards-list';

      // --- Construct Cards ---
      year.cards.forEach((card) => {
        const cardItem = document.createElement('li');
        cardItem.className = 'timeline-card-item';

        // Transfer AEM instrumentation from the authored card row to the list item
        moveInstrumentation(card, cardItem);

        const imageContainer = card.children[0];
        const textContainer = card.children[1];

        if (imageContainer) {
          const cardImage = document.createElement('div');
          cardImage.className = 'card-image';
          while (imageContainer.firstElementChild) {
            cardImage.append(imageContainer.firstElementChild);
          }
          cardItem.appendChild(cardImage);
        }

        if (textContainer) {
          const cardBody = document.createElement('div');
          cardBody.className = 'card-body';
          while (textContainer.firstElementChild) {
            cardBody.append(textContainer.firstElementChild);
          }
          cardItem.appendChild(cardBody);
        }

        cardsList.appendChild(cardItem);
      });

      cardsContainer.appendChild(cardsList);
      panel.appendChild(cardsContainer);
      fragment.appendChild(panel);
    });

    // 4. Create Arrows
    const arrows = document.createElement('div');
    arrows.className = 'timeline-arrows';

    const prevIcon = document.createElement('span');
    prevIcon.className = 'icon icon-arrow-right';

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
    nextIcon.className = 'icon icon-arrow-right';

    const nextButton = document.createElement('button');
    nextButton.type='button';
    nextButton.className = 'timeline-arrow timeline-arrow-next';
    nextButton.setAttribute('aria-label', 'Next year');
    nextButton.appendChild(nextIcon);
    nextButton.addEventListener('click', () => {
      const activeIndex = parseInt(block.dataset.activeYear || '0', 10);
      showYear(block, activeIndex + 1);
    });

    arrows.append(prevButton, nextButton);
    // tablist.append(arrows);

    // 5. Final Assembly
    block.innerHTML = '';
    block.prepend(tablist);
    block.append(arrows);
    block.append(fragment);

    // initSwiper(block);
    initDragScroll(block);
    showYear(block, 0);
  }
}

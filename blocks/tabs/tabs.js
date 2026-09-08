/* global Swiper */
// eslint-disable-next-line import/no-unresolved
import { toClassName } from '../../scripts/aem.js';

function showYear(block, index) {
  const markers = block.querySelectorAll('.timeline-marker-btn');
  const panels = block.querySelectorAll('.timeline-panel');
  const total = markers.length;
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

async function decorateTimeline(block) {
  const tablist = document.createElement('div');
  tablist.className = 'tabs-list timeline-nav';
  tablist.setAttribute('role', 'tablist');

  const line = document.createElement('div');
  line.className = 'timeline-line';
  tablist.append(line);

  const tabs = [...block.children].map((child) => child.firstElementChild);
  tabs.forEach((tab, i) => {
    const id = toClassName(tab.textContent);

    const button = document.createElement('button');
    button.className = 'tabs-tab timeline-marker-btn';
    button.id = `tab-${id}`;
    button.innerHTML = `<span class="timeline-marker-dot"></span>${tab.innerHTML}`;
    button.setAttribute('aria-controls', `tabpanel-${id}`);
    button.setAttribute('aria-selected', !i);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');
    button.addEventListener('click', () => showYear(block, i));

    tablist.append(button);

    const panel = block.children[i];
    panel.className = 'tabs-panel timeline-panel';
    panel.id = `tabpanel-${id}`;
    panel.setAttribute('aria-hidden', !!i);
    panel.setAttribute('role', 'tabpanel');

    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'timeline-cards';
    cardsContainer.innerHTML = panel.innerHTML;
    panel.innerHTML = '';
    panel.append(cardsContainer);
  });

  const arrows = document.createElement('div');
  arrows.className = 'timeline-arrows';

  const prevButton = document.createElement('button');
  prevButton.className = 'timeline-arrow timeline-arrow-prev';
  prevButton.type = 'button';
  prevButton.setAttribute('aria-label', 'Previous year');

  const nextButton = document.createElement('button');
  nextButton.className = 'timeline-arrow timeline-arrow-next';
  nextButton.type = 'button';
  nextButton.setAttribute('aria-label', 'Next year');

  arrows.append(prevButton, nextButton);
  tablist.append(arrows);

  block.prepend(tablist);

  initSwiper(block);
  showYear(block, 0);
}

function decorateDefaultTabs(block) {
  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');

  const tabs = [...block.children].map((child) => child.firstElementChild);
  tabs.forEach((tab, i) => {
    const id = toClassName(tab.textContent);

    const tabpanel = block.children[i];
    tabpanel.className = 'tabs-panel';
    tabpanel.id = `tabpanel-${id}`;
    tabpanel.setAttribute('aria-hidden', !!i);
    tabpanel.setAttribute('aria-labelledby', `tab-${id}`);
    tabpanel.setAttribute('role', 'tabpanel');

    const button = document.createElement('button');
    button.className = 'tabs-tab';
    button.id = `tab-${id}`;
    button.innerHTML = tab.innerHTML;
    button.setAttribute('aria-controls', `tabpanel-${id}`);
    button.setAttribute('aria-selected', !i);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');
    button.addEventListener('click', () => {
      block.querySelectorAll('[role=tabpanel]').forEach((panel) => {
        panel.setAttribute('aria-hidden', true);
      });
      tablist.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', false);
      });
      tabpanel.setAttribute('aria-hidden', false);
      button.setAttribute('aria-selected', true);
    });
    tablist.append(button);
    tab.remove();
  });

  block.prepend(tablist);
}

export default async function decorate(block) {
  const isTimeline = block.classList.contains('timeline');

  if (isTimeline) {
    await decorateTimeline(block);
  } else {
    decorateDefaultTabs(block);
  }
}

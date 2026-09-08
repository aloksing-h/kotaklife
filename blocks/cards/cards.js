import { createOptimizedPicture, loadCSS } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const mobileMedia = window.matchMedia('(max-width: 599px)');

function decorateInsightsCard(card) {
  const body = card.querySelector('.cards-card-body');
  if (!body) return;

  const badge = [...body.children].find((element) => (
    element.tagName === 'P'
    && !element.classList.contains('button-wrapper')
    && element.textContent.trim().length <= 20
  ));

  if (badge) {
    badge.classList.add('cards-card-badge');
    const cardType = badge.textContent.trim().toLowerCase();
    if (cardType) card.dataset.cardType = cardType;
  }

  const action = body.querySelector('a[href]');
  if (action) {
    const actionWrapper = action.closest('p');
    actionWrapper?.classList.add('cards-card-action-wrapper');
    action.classList.add('cards-card-action');
    const actionLabel = action.title
      || action.textContent.trim()
      || `${card.dataset.cardType || 'card'} details`;
    action.setAttribute('aria-label', actionLabel);
  }
}

function decorateInsightsSection(block) {
  const section = block.closest('.insights-impact-plans');
  if (!section) return;

  const wrapper = block.parentElement;
  const header = wrapper.previousElementSibling;
  const footer = wrapper.nextElementSibling;

  section.classList.add('insights-impact-ready');
  header?.classList.add('insights-impact-header');
  if (footer?.querySelector('a[href]')) footer.classList.add('insights-impact-footer');

  const heading = header?.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading?.id) block.setAttribute('aria-labelledby', heading.id);
  block.setAttribute('role', 'region');

  block.querySelectorAll(':scope > ul > li').forEach(decorateInsightsCard);
}

async function setupMobileSwiper(block) {
  let swiper;

  const updateSwiper = async () => {
    if (!mobileMedia.matches) {
      if (swiper) {
        swiper.destroy(true, true);
        swiper = null;
      }
      block.classList.remove('swiper');
      block.querySelector(':scope > ul')?.classList.remove('swiper-wrapper');
      block.querySelectorAll(':scope > ul > li').forEach((slide) => {
        slide.classList.remove('swiper-slide');
      });
      block.querySelector('.insights-impact-pagination')?.remove();
      return;
    }

    if (swiper) return;

    await loadCSS(`${window.hlx.codeBasePath}/blocks/swiper/swiper-bundle.min.css`);
    const { default: createSwiper } = await import('../swiper/swiper-bundle.min.js');
    if (!mobileMedia.matches || !block.isConnected) return;

    block.classList.add('swiper');
    block.querySelector(':scope > ul').classList.add('swiper-wrapper');
    block.querySelectorAll(':scope > ul > li').forEach((slide) => {
      slide.classList.add('swiper-slide');
    });

    const pagination = document.createElement('div');
    pagination.className = 'insights-impact-pagination';
    block.append(pagination);

    swiper = createSwiper(block, {
      slidesPerView: 'auto',
      spaceBetween: 8,
      speed: 400,
      keyboard: {
        enabled: true,
      },
      pagination: {
        el: pagination,
        clickable: true,
      },
      a11y: {
        enabled: true,
      },
    });
  };

  await updateSwiper();
  mobileMedia.addEventListener('change', updateSwiper);
}

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.replaceChildren(ul);

  if (block.closest('.insights-impact-plans')) {
    decorateInsightsSection(block);
    setupMobileSwiper(block);
  }
}

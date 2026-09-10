import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Updates the 3D card stack classes and step pagination state
 * @param {Array<Element>} cards List of card elements
 * @param {Array<Element>} steps List of step button elements
 * @param {number} activeIndex Selected card index
 */
function updateCardStack(cards, steps, activeIndex) {
  const total = cards.length;

  cards.forEach((card, i) => {
    // Reset state classes
    card.classList.remove('is-active', 'stack-layer-1', 'stack-layer-2', 'stack-hidden');

    const offset = (i - activeIndex + total) % total;

    if (offset === 0) {
      card.classList.add('is-active');
    } else if (offset === 1) {
      card.classList.add('stack-layer-1');
    } else if (offset === 2) {
      card.classList.add('stack-layer-2');
    } else {
      card.classList.add('stack-hidden');
    }
  });

  steps.forEach((step, i) => {
    step.classList.toggle('is-active', i === activeIndex);
  });
}

/**
 * Decorates the custom-rte block inside get-cover-plans section
 * @param {Element} block The custom-rte block element
 */
export default function decorate(block) {
  const section = block.closest('.get-cover-plans');

  // 1. Decorate CTA Button in default-content-wrapper
  if (section) {
    const ctaLink = section.querySelector('.default-content-wrapper a');
    if (ctaLink && !ctaLink.querySelector('.btn-arrow')) {
      ctaLink.classList.add('get-cover-cta');
      const arrowSpan = document.createElement('span');
      arrowSpan.className = 'btn-arrow';
      arrowSpan.innerHTML = '→';
      ctaLink.append(arrowSpan);
    }
  }

  // 2. Build 3D Card Deck Container
  const cardsContainer = document.createElement('ul');
  cardsContainer.className = 'custom-rte-cards';

  const rows = [...block.children];
  const cards = [];

  rows.forEach((row, index) => {
    const li = document.createElement('li');
    li.className = 'custom-rte-card';
    moveInstrumentation(row, li); // Preserve Universal Editor metadata

    const contentDiv = row.firstElementChild?.firstElementChild || row;

    // Extract Plan Badge (e.g. "TERM PLAN")
    const badgeP = contentDiv.querySelector('p');
    if (badgeP) {
      const badgeSpan = document.createElement('span');
      badgeSpan.className = 'plan-badge';
      badgeSpan.textContent = badgeP.textContent.trim();
      li.append(badgeSpan);
    }

    // Extract List Content
    const list = contentDiv.querySelector('ul');
    if (list) {
      const cardBody = document.createElement('div');
      cardBody.className = 'plan-card-body';
      cardBody.append(list.cloneNode(true));
      li.append(cardBody);
    }

    // Card click activates card to front
    li.addEventListener('click', () => {
      const steps = block.querySelectorAll('.step-indicator');
      updateCardStack(cards, steps, index);
    });

    cards.push(li);
    cardsContainer.append(li);
  });

  // 3. Build Step Pagination Bar (01 -- 02 03)
  const paginationWrapper = document.createElement('div');
  paginationWrapper.className = 'plan-pagination';

  const stepsContainer = document.createElement('div');
  stepsContainer.className = 'steps-container';

  const steps = [];
  cards.forEach((_, i) => {
    const stepBtn = document.createElement('button');
    stepBtn.type = 'button';
    stepBtn.className = `step-indicator ${i === 0 ? 'is-active' : ''}`;
    stepBtn.textContent = String(i + 1).padStart(2, '0');
    stepBtn.setAttribute('aria-label', `View plan ${i + 1}`);

    stepBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      updateCardStack(cards, steps, i);
    });

    steps.push(stepBtn);
    stepsContainer.append(stepBtn);

    // Progress line track after active/first item
    if (i === 0) {
      const progressTrack = document.createElement('span');
      progressTrack.className = 'progress-track';
      stepsContainer.append(progressTrack);
    }
  });

  paginationWrapper.append(stepsContainer);

  // 4. Update Block DOM
  block.textContent = '';
  block.append(cardsContainer, paginationWrapper);

  // Set initial 3D stack state
  updateCardStack(cards, steps, 0);
}

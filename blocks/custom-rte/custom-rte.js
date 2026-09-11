import { moveInstrumentation } from '../../scripts/scripts.js';

let autoSlideTimer = null;
const SLIDE_DURATION = 5000; // 5 seconds per card

/**
 * Resets and triggers the progress line animation
 * @param {Element} trackWrapper The progress track wrapper element
 */
function restartProgressAnimation(trackWrapper) {
  if (!trackWrapper) return;
  trackWrapper.classList.remove('animating');
  // Trigger reflow to restart CSS keyframe animation
  trackWrapper.getBoundingClientRect();
  trackWrapper.classList.add('animating');
}

/**
 * Updates 3D card stack layer classes, color states, and step line position
 * @param {Array<Element>} cards List of card elements
 * @param {Array<Element>} steps List of step button elements
 * @param {Element} trackWrapper Progress track line element
 * @param {number} activeIndex Currently selected card index
 * @param {Function} onAutoAdvance Callback for timer completion
 */
function updateCardStack(cards, steps, trackWrapper, activeIndex, onAutoAdvance) {
  const total = cards.length;

  // 1. Update card stack layers and trigger background color transitions
  cards.forEach((card, i) => {
    card.classList.remove('is-active', 'stack-layer-1', 'stack-layer-2', 'stack-hidden');

    const offset = (i - activeIndex + total) % total;

    if (offset === 0) {
      card.classList.add('is-active'); // Red Gradient
    } else if (offset === 1) {
      card.classList.add('stack-layer-1'); // Dark Navy
    } else if (offset === 2) {
      card.classList.add('stack-layer-2'); // Dark Burgundy
    } else {
      card.classList.add('stack-hidden');
    }
  });

  // 2. Update step active state and move progress track line
  steps.forEach((step, i) => {
    const isActive = i === activeIndex;
    step.classList.toggle('is-active', isActive);

    if (isActive && trackWrapper) {
      // Position the progress track immediately after the active step button
      step.after(trackWrapper);
    }
  });

  // 3. Restart progress bar fill animation & auto-slide timer
  restartProgressAnimation(trackWrapper);

  if (autoSlideTimer) clearInterval(autoSlideTimer);
  autoSlideTimer = setInterval(() => {
    if (onAutoAdvance) onAutoAdvance();
  }, SLIDE_DURATION);
}

/**
 * Decorates custom-rte block in get-cover-plans section
 * @param {Element} block The custom-rte block element
 */
export default function decorate(block) {
  const section = block.closest('.get-cover-plans');

  // Decorate CTA Button in default-content-wrapper
  if (section) {
    const ctaLink = section.querySelector('.default-content-wrapper a');
    if (ctaLink && !ctaLink.querySelector('.btn-arrow')) {
      ctaLink.classList.add('get-cover-cta');
      const arrowSpan = document.createElement('span');
      arrowSpan.className = 'btn-arrow';
      ctaLink.append(arrowSpan);
    }
  }

  // Build 3D Card Deck Container
  const cardsContainer = document.createElement('ul');
  cardsContainer.className = 'custom-rte-cards';

  const rows = [...block.children];
  const cards = [];
  const steps = [];

  rows.forEach((row) => {
    const li = document.createElement('li');
    li.className = 'custom-rte-card';
    moveInstrumentation(row, li);

    const cell = row.children[0] || row;

    // Extract Plan Badge (e.g. "TERM PLAN")
    const badgeP = cell.querySelector('p');
    if (badgeP && badgeP.textContent.trim()) {
      const badgeSpan = document.createElement('span');
      badgeSpan.className = 'plan-badge';
      badgeSpan.textContent = badgeP.textContent.trim();
      li.append(badgeSpan);
    }

    // Extract List Content
    const list = cell.querySelector('ul');
    if (list) {
      const cardBody = document.createElement('div');
      cardBody.className = 'plan-card-body';
      cardBody.append(list.cloneNode(true));
      li.append(cardBody);
    }

    cards.push(li);
    cardsContainer.append(li);
  });

  // Build Step Pagination Bar with animated track (01 ━━━━ 02 03)
  const paginationWrapper = document.createElement('div');
  paginationWrapper.className = 'plan-pagination';

  const stepsContainer = document.createElement('div');
  stepsContainer.className = 'steps-container';

  const trackWrapper = document.createElement('div');
  trackWrapper.className = 'progress-track-wrapper';
  const trackFill = document.createElement('span');
  trackFill.className = 'progress-bar-fill';
  trackWrapper.append(trackFill);

  let currentIndex = 0;

  const handleNextSlide = () => {
    currentIndex = (currentIndex + 1) % cards.length;
    updateCardStack(cards, steps, trackWrapper, currentIndex, handleNextSlide);
  };

  cards.forEach((_, i) => {
    const stepBtn = document.createElement('button');
    stepBtn.type = 'button';
    stepBtn.className = `step-indicator ${i === 0 ? 'is-active' : ''}`;
    stepBtn.textContent = String(i + 1).padStart(2, '0');
    stepBtn.setAttribute('aria-label', `View plan ${i + 1}`);

    stepBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentIndex = i;
      updateCardStack(cards, steps, trackWrapper, currentIndex, handleNextSlide);
    });

    steps.push(stepBtn);
    stepsContainer.append(stepBtn);

    // Add click listener on cards to advance stack
    cards[i].addEventListener('click', () => {
      currentIndex = i;
      updateCardStack(cards, steps, trackWrapper, currentIndex, handleNextSlide);
    });
  });

  stepsContainer.append(trackWrapper);
  paginationWrapper.append(stepsContainer);

  // Update Block DOM
  block.textContent = '';
  block.append(cardsContainer, paginationWrapper);

  // Initialize stack & start progress track timer
  updateCardStack(cards, steps, trackWrapper, 0, handleNextSlide);
}

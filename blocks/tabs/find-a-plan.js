/**
 * AEM Edge Delivery Services (EDS) - Promotion / 3D Card Stack Block
 */
/* eslint-disable */

function decorateFindAPlanHover(block) {
  const cardSelector = [
    '.find-plan.custom-cards-container .custom-cards > ul > li'
  ].join(', ');

  const bindCards = () => [...block.querySelectorAll(cardSelector)].forEach((card) => {
    if (card.dataset.findAPlanHoverInitialized === 'true') return;
    card.dataset.findAPlanHoverInitialized = 'true';

    let leaveTimer;

    card.addEventListener('mouseenter', () => {
      clearTimeout(leaveTimer);
      card.classList.remove('is-leaving');
    });

    card.addEventListener('mouseleave', () => {
      card.classList.add('is-leaving');
      leaveTimer = setTimeout(() => card.classList.remove('is-leaving'), 700);
    });
  });

  bindCards();

  if (block.dataset.findAPlanHoverObserverInitialized === 'true') return;
  block.dataset.findAPlanHoverObserverInitialized = 'true';

  const observer = new MutationObserver(bindCards);
  observer.observe(block, { childList: true, subtree: true });
}

export default function decorate(block) {
  decorateFindAPlanHover(block);

  const cardList = block.querySelector('.custom-rte-cards');
  if (!cardList) return;

  const cards = [...cardList.querySelectorAll('.custom-rte-card')];
  const totalCards = cards.length;
  if (totalCards === 0) return;

  const pagination = block.querySelector('.plan-pagination');
  const stepIndicators = pagination ? [...pagination.querySelectorAll('.step-indicator')] : [];
  const progressWrapper = pagination ? pagination.querySelector('.progress-track-wrapper') : null;

  let activeIndex = 0;
  let autoRotateTimer = null;
  const ROTATION_INTERVAL = 5000; // 5 seconds per slide

  // Apply base color themes to individual cards
  const cardThemes = ['theme-red-gradient', 'theme-navy-blue', 'theme-burgundy'];
  cards.forEach((card, index) => {
    const themeClass = cardThemes[index % cardThemes.length];
    card.classList.add(themeClass);
    card.dataset.index = index;
  });

  /**
   * Updates stack layer classes for all cards relative to activeIndex
   */
  function updateStack() {
    cards.forEach((card, i) => {
      // Calculate normalized relative position in stack ring
      const relPosition = (i - activeIndex + totalCards) % totalCards;

      // Remove existing position classes
      card.classList.remove('is-active', 'stack-layer-1', 'stack-layer-2', 'stack-hidden');

      if (relPosition === 0) {
        card.classList.add('is-active');
      } else if (relPosition === 1) {
        card.classList.add('stack-layer-1');
      } else if (relPosition === 2) {
        card.classList.add('stack-layer-2');
      } else {
        card.classList.add('stack-hidden');
      }
    });

    // Update Pagination Steps & Progress Bar
    stepIndicators.forEach((btn, idx) => {
      btn.classList.toggle('is-active', idx === activeIndex);
    });

    resetProgressBar();
  }

  /**
   * Resets and triggers progress bar animation fill
   */
  function resetProgressBar() {
    if (!progressWrapper) return;
    progressWrapper.classList.remove('animating');
    // Force DOM reflow to restart CSS animation
    void progressWrapper.offsetWidth;
    progressWrapper.classList.add('animating');
  }

  /**
   * Switches stack to specific target index
   */
  function goToSlide(index) {
    activeIndex = (index + totalCards) % totalCards;
    updateStack();
    startAutoRotate();
  }

  /**
   * Starts or restarts auto-rotation timer
   */
  function startAutoRotate() {
    stopAutoRotate();
    autoRotateTimer = setInterval(() => {
      goToSlide(activeIndex + 1);
    }, ROTATION_INTERVAL);
  }

  function stopAutoRotate() {
    if (autoRotateTimer) {
      clearInterval(autoRotateTimer);
      autoRotateTimer = null;
    }
  }

  // --- Event Listeners ---

  // Direct click on cards in stack
  cards.forEach((card, index) => {
    card.addEventListener('click', () => {
      if (index !== activeIndex) {
        goToSlide(index);
      }
    });
  });

  // Step Indicator button clicks
  stepIndicators.forEach((btn, index) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      goToSlide(index);
    });
  });

  // Hover state to pause timer
  block.addEventListener('mouseenter', stopAutoRotate);
  block.addEventListener('mouseleave', startAutoRotate);

  // Initialize Stack state
  updateStack();
  startAutoRotate();
}

import { moveInstrumentation } from '../../scripts/scripts.js';

const SLIDE_DURATION = 3000; // 3 seconds per card

function addLayerClasses(element, classNameMap, depth = 1) {
  if (!element || !element.children) return;
  const className = classNameMap[depth] || `level-${depth}`;
  Array.from(element.children).forEach((child, index) => {
    child.classList.add(className);
    child.classList.add(`${className}-${index + 1}`);
    addLayerClasses(child, classNameMap, depth + 1);
  });
}

/**
 * Resets and triggers the progress line animation
 * @param {Element} trackWrapper The progress track wrapper element
 */
function restartProgressAnimation(trackWrapper) {
  if (!trackWrapper) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    trackWrapper.classList.remove('animating');
    return;
  }
  trackWrapper.style.setProperty('--slide-duration', `${SLIDE_DURATION}ms`);
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
 */
function updateCardStack(cards, steps, trackWrapper, activeIndex) {
  const total = cards.length;

  // 1. Update card stack layers and trigger background color transitions
  cards.forEach((card, i) => {
    card.style.transform = '';
    card.style.transition = '';
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
    step.setAttribute('aria-pressed', String(isActive));

    if (isActive && trackWrapper) {
      // Position the progress track immediately after the active step button
      step.after(trackWrapper);
    }
  });

  restartProgressAnimation(trackWrapper);
}

/**
 * Decorates custom-rte block in get-cover-plans section
 * @param {Element} block The custom-rte block element
 */
export default async function decorate(block) {
  if (block.classList.contains('promotion')) {
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
      updateCardStack(cards, steps, trackWrapper, currentIndex);
    };

    const handlePrevSlide = () => {
      currentIndex = (currentIndex - 1 + cards.length) % cards.length;
      updateCardStack(cards, steps, trackWrapper, currentIndex);
    };
    let startX = 0;
    let startY = 0;
    let diffX = 0;
    let isDragging = false;
    let isHorizontalSwipe = false;
    let justDragged = false;
    cards.forEach((_, i) => {
      const stepBtn = document.createElement('button');
      stepBtn.type = 'button';
      stepBtn.className = `step-indicator ${i === 0 ? 'is-active' : ''}`;
      stepBtn.textContent = String(i + 1).padStart(2, '0');
      stepBtn.setAttribute('aria-label', `View plan ${i + 1}`);

      stepBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = i;
        updateCardStack(cards, steps, trackWrapper, currentIndex);
      });

      steps.push(stepBtn);
      stepsContainer.append(stepBtn);

      // Add click listener on cards to advance stack (only if not dragging)
      cards[i].addEventListener('click', () => {
        if (justDragged) return;
        currentIndex = i;
        updateCardStack(cards, steps, trackWrapper, currentIndex);
      });
    });

    // Touch & Pointer Drag / Swipe Gesture Handlers
    const resetActiveCardStyle = () => {
      const activeCard = cardsContainer.querySelector('.custom-rte-card.is-active');
      if (activeCard) {
        activeCard.style.transition = '';
        activeCard.style.transform = '';
      }
    };

    cardsContainer.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      startX = e.clientX;
      startY = e.clientY;
      diffX = 0;
      isDragging = true;
      isHorizontalSwipe = false;
    });

    cardsContainer.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      diffX = e.clientX - startX;
      const diffY = e.clientY - startY;
      if (!isHorizontalSwipe) {
        // Allow vertical page scroll without capturing
        if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 8) {
          isDragging = false;
          return;
        }
        // Horizontal swipe detected
        if (Math.abs(diffX) > 8) {
          isHorizontalSwipe = true;
          try {
            cardsContainer.setPointerCapture(e.pointerId);
          } catch (_) {
            // Ignore if pointer capture is not supported
          }
        }
      }
      if (isHorizontalSwipe) {
        const activeCard = cardsContainer.querySelector('.custom-rte-card.is-active');
        if (activeCard) {
          activeCard.style.transition = 'none';
          activeCard.style.transform = `translate(${diffX}px, ${diffX * 0.04}px) rotate(${diffX * 0.03}deg)`;
        }
      }
    });

    const finishDrag = (e) => {
      if (!isDragging && !isHorizontalSwipe) return;
      const wasSwiping = isHorizontalSwipe;
      isDragging = false;
      isHorizontalSwipe = false;
      if (e && e.pointerId && cardsContainer.hasPointerCapture
        && cardsContainer.hasPointerCapture(e.pointerId)) {
        cardsContainer.releasePointerCapture(e.pointerId);
      }
      resetActiveCardStyle();
      if (wasSwiping) {
        justDragged = true;
        setTimeout(() => {
          justDragged = false;
        }, 200);
        const SWIPE_THRESHOLD = 45;
        if (diffX < -SWIPE_THRESHOLD) {
          // Swiped left: fast-forward to next card
          handleNextSlide();
        } else if (diffX > SWIPE_THRESHOLD) {
          // Swiped right: go to previous card
          handlePrevSlide();
        } else {
          // Insufficient distance: snap back and resume
          updateCardStack(cards, steps, trackWrapper, currentIndex);
        }
      }
    };
    cardsContainer.addEventListener('pointerup', finishDrag);
    cardsContainer.addEventListener('pointercancel', finishDrag);
    stepsContainer.append(trackWrapper);
    paginationWrapper.append(stepsContainer);

    // Update Block DOM
    block.textContent = '';
    block.append(cardsContainer, paginationWrapper);

    updateCardStack(cards, steps, trackWrapper, 0);
  }

  if (block.closest('.section.calc-card')) {
    const isCommonText = block.classList.contains('cmmn-txt')
      || block.classList.contains('cmmn-txt-row');
    if (!isCommonText) {
      addLayerClasses(block, {
        1: 'card-calc',
        2: 'card-inner',
        3: 'card-child',
        4: 'card-item',
      });
    }
    if (!block.classList.contains('card-link')) {
      [...block.children].forEach((row) => {
        row.children[2]?.remove();
      });
    } else {
      [...block.children].forEach((row) => {
        const [imgDiv, textDiv, linkDiv] = row.children;
        const link = linkDiv?.querySelector('a');
        if (!link) return;
        link.textContent = '';
        link.classList.add('calc-card-link');
        linkDiv.remove();
        link.append(imgDiv, textDiv);
        row.append(link);
        row.classList.add('calc-card-item');
        const href = link.getAttribute('href');
        row.setAttribute('role', 'button');
        row.setAttribute('tabindex', '0');
        row.setAttribute('aria-label', `Navigate to ${href}`);
        // Row is the focus target, so keep the inner link out of tab order
        link.setAttribute('tabindex', '-1');
        row.addEventListener('keydown', (e) => {
          if (e.code === 'Enter' || e.code === 'Space') {
            e.preventDefault();
            window.location.href = href;
          }
        });
      });
    }

    const cards = [...block.children];
    if (cards.length > 4) {
      const mobileQuery = window.matchMedia('(max-width: 768px)');
      let isInitializingSwiper = false;

      const disableSwiper = () => {
        if (block.swiperInstance) {
          block.swiperInstance.destroy(true, true);
          block.swiperInstance = null;
        }

        const swiperWrapper = block.querySelector(':scope > .swiper-wrapper');
        cards.forEach((card) => {
          card.classList.remove('swiper-slide');
          block.append(card);
        });
        swiperWrapper?.remove();
        block.querySelector(':scope > .swiper-pagination')?.remove();
        block.classList.remove('swiper');
      };

      const enableSwiper = async () => {
        if (block.swiperInstance || isInitializingSwiper) return;
        isInitializingSwiper = true;

        block.classList.add('swiper');
        const swiperWrapper = document.createElement('div');
        swiperWrapper.className = 'swiper-wrapper';
        cards.forEach((card) => {
          card.classList.add('swiper-slide');
          swiperWrapper.append(card);
        });

        const pagination = document.createElement('div');
        pagination.className = 'swiper-pagination';
        block.append(swiperWrapper, pagination);

        const { default: createSwiper } = await import('../swiper/swiper-bundle.min.js');
        if (!mobileQuery.matches) {
          disableSwiper();
          isInitializingSwiper = false;
          return;
        }

        block.swiperInstance = createSwiper(block, {
          slidesPerView: 2,
          slidesPerGroup: 2,
          spaceBetween: 8,
          grabCursor: true,
          observer: true,
          observeParents: true,
          grid: {
            rows: 2,
            fill: 'row',
          },
          pagination: {
            el: pagination,
            clickable: true,
          },
        });
        isInitializingSwiper = false;
      };

      const toggleSwiper = () => {
        if (mobileQuery.matches) enableSwiper();
        else disableSwiper();
      };

      toggleSwiper();
      mobileQuery.addEventListener('change', toggleSwiper);
    }
  }
}

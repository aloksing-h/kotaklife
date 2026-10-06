import { createModal } from '../modal/modal.js';

function addLongPressListener(element, callback, duration = 600) {
  let timer;
  let startX = 0;
  let startY = 0;
  const moveTolerance = 10; // allow small finger jitter without cancelling the press

  const start = (e) => {
    if (!window.matchMedia('(max-width: 767px)').matches) {
      return;
    }

    if (e.type === 'mousedown' && e.button !== 0) return;

    const point = e.touches ? e.touches[0] : e;
    startX = point.clientX;
    startY = point.clientY;

    timer = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50);
      callback(e);
    }, duration);
  };

  const cancel = () => {
    clearTimeout(timer);
  };

  const handleMove = (e) => {
    const point = e.touches ? e.touches[0] : e;
    const deltaX = Math.abs(point.clientX - startX);
    const deltaY = Math.abs(point.clientY - startY);
    if (deltaX > moveTolerance || deltaY > moveTolerance) {
      cancel();
    }
  };

  element.addEventListener('touchstart', start, { passive: true });
  element.addEventListener('touchend', cancel);
  element.addEventListener('touchmove', handleMove, { passive: true });

  element.addEventListener('mousedown', start);
  element.addEventListener('mouseup', cancel);
  element.addEventListener('mouseleave', cancel);
  element.addEventListener('mousemove', handleMove);

  element.addEventListener('contextmenu', (e) => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      e.preventDefault();
    }
  });
}

export default function decorateFormTab(block) {
  const mediaQuery = window.matchMedia('(max-width: 767px)');

  const handleViewChange = (e) => {
    if (e.matches) {
      block.classList.add('mobile-view');
    } else {
      block.classList.remove('mobile-view');
    }
  };

  // Set initial state
  handleViewChange(mediaQuery);

  // Listen for window resize events
  mediaQuery.addEventListener('change', handleViewChange);
  const originalTabButtons = block.querySelectorAll('button[role="tab"]');
  const tabPanels = block.querySelectorAll('div[role="tabpanel"]');
  const tablistWrapper = block.querySelector('.tablist-wrapper');

  if (tablistWrapper) {
    tabPanels.forEach((panel) => {
      if (panel.parentElement && panel.parentElement.tagName.toUpperCase() === 'LI') {
        tablistWrapper.appendChild(panel);
      }
    });
  }

  const tabButtons = Array.from(originalTabButtons).map((button) => {
    const cleanButton = button.cloneNode(true);
    cleanButton.style.userSelect = 'none';
    cleanButton.style.webkitUserSelect = 'none';
    button.parentNode.replaceChild(cleanButton, button);
    return cleanButton;
  });

  const lastPanel = tabPanels[tabPanels.length - 1];

  const authoredPrev = lastPanel ? (lastPanel.querySelector('a[title="Previous"]') || Array.from(lastPanel.querySelectorAll('a')).find((a) => a.textContent.includes('Previous'))) : null;
  const authoredNext = lastPanel ? (lastPanel.querySelector('a[title="Next"]') || Array.from(lastPanel.querySelectorAll('a')).find((a) => a.textContent.includes('Next'))) : null;

  // Fetch both Show More and Show Less authored links
  const authoredShowMore = lastPanel ? (lastPanel.querySelector('a[title="Show More"]') || Array.from(lastPanel.querySelectorAll('a')).find((a) => a.textContent.toLowerCase().includes('show more'))) : null;
  const authoredShowLess = lastPanel ? (lastPanel.querySelector('a[title="Show Less"]') || Array.from(lastPanel.querySelectorAll('a')).find((a) => a.textContent.toLowerCase().includes('show less'))) : null;

  // --- DESKTOP "SHOW MORE / SHOW LESS" LOGIC ---
  const tabListUl = block.querySelector('ul[role="tablist"]');

  if (authoredShowMore && tabListUl) {
    const showMoreLi = document.createElement('li');
    showMoreLi.className = 'show-more-item';

    const showMoreBtn = document.createElement('button');
    showMoreBtn.className = 'desktop-show-more-btn show-more-btn';
    showMoreBtn.type = 'button';
    showMoreBtn.innerHTML = authoredShowMore.innerHTML;

    const showLessBtn = document.createElement('button');
    showLessBtn.className = 'desktop-show-more-btn show-less-btn';
    showLessBtn.type = 'button';
    showLessBtn.innerHTML = authoredShowLess ? authoredShowLess.innerHTML : 'Show Less';

    showMoreBtn.addEventListener('click', (e) => {
      e.preventDefault();
      block.classList.add('tabs-expanded');
    });

    showLessBtn.addEventListener('click', (e) => {
      e.preventDefault();
      block.classList.remove('tabs-expanded');
    });

    showMoreLi.appendChild(showMoreBtn);
    showMoreLi.appendChild(showLessBtn);
    tabListUl.appendChild(showMoreLi);

    // Clean up both authored paragraphs from the DOM
    const wrapperMore = authoredShowMore.closest('p');
    if (wrapperMore) wrapperMore.remove();

    if (authoredShowLess) {
      const wrapperLess = authoredShowLess.closest('p');
      if (wrapperLess) wrapperLess.remove();
    }
  }

  if (tabButtons.length > 8) {
    block.classList.add('has-many-tabs');
  }

  // --- INJECT MOBILE ARROW NAVIGATION ---
  const mobileNav = document.createElement('div');
  mobileNav.className = 'mobile-tab-arrows';

  const btnPrev = document.createElement('button');
  btnPrev.className = 'nav-prev';
  btnPrev.type = 'button';

  if (authoredPrev) {
    btnPrev.innerHTML = authoredPrev.innerHTML;
    const wrapper = authoredPrev.closest('p');
    if (wrapper) wrapper.remove();
  } else {
    btnPrev.textContent = 'Previous';
  }

  const btnNext = document.createElement('button');
  btnNext.className = 'nav-next';
  btnNext.type = 'button';

  if (authoredNext) {
    btnNext.innerHTML = authoredNext.innerHTML;
    const wrapper = authoredNext.closest('p');
    if (wrapper) wrapper.remove();
  } else {
    btnNext.textContent = 'Next';
  }

  mobileNav.appendChild(btnPrev);
  mobileNav.appendChild(btnNext);
  block.appendChild(mobileNav);

  let currentIndex = 0;

  const switchTab = (index) => {
    if (index < 0 || index >= tabButtons.length) return;
    currentIndex = index;

    tabButtons.forEach((btn, i) => {
      const isTarget = i === index;

      const li = btn.closest('li');
      if (li) {
        if (isTarget) {
          li.classList.add('mobile-active-step');
        } else {
          li.classList.remove('mobile-active-step');
        }
      }

      btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
      btn.setAttribute('aria-expanded', isTarget ? 'true' : 'false');

      const targetPanelId = btn.getAttribute('aria-controls');
      const targetPanel = block.querySelector(`#${targetPanelId}`);

      if (targetPanel) {
        if (isTarget) {
          targetPanel.removeAttribute('hidden');
          targetPanel.setAttribute('aria-hidden', 'false');
          targetPanel.classList.remove('hidden');
        } else {
          targetPanel.setAttribute('hidden', '');
          targetPanel.setAttribute('aria-hidden', 'true');
          targetPanel.classList.add('hidden');
        }
      }
    });

    btnPrev.disabled = currentIndex === 0;
    btnNext.disabled = currentIndex === tabButtons.length - 1;
  };

  const activeIndex = tabButtons.findIndex((btn) => btn.getAttribute('aria-selected') === 'true');
  switchTab(activeIndex > -1 ? activeIndex : 0);

  tabButtons.forEach((button, i) => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const isAlreadyActive = button.getAttribute('aria-selected') === 'true';

      if (!isAlreadyActive) {
        switchTab(i);
      } else {
        button.setAttribute('aria-selected', 'false');
        button.setAttribute('aria-expanded', 'false');
        const targetPanel = block.querySelector(`#${button.getAttribute('aria-controls')}`);
        if (targetPanel) {
          targetPanel.setAttribute('hidden', '');
          targetPanel.setAttribute('aria-hidden', 'true');
          targetPanel.classList.add('hidden');
        }
      }
    });

    addLongPressListener(button, async () => {
      const modalContainer = document.createElement('div');
      modalContainer.className = 'dynamic-tab-modal';

      const title = document.createElement('h3');
      title.textContent = 'Select Step';
      modalContainer.appendChild(title);

      const list = document.createElement('ul');

      tabButtons.forEach((btn, btnIndex) => {
        const li = document.createElement('li');
        const link = document.createElement('a');

        link.textContent = btn.textContent.trim();
        link.href = '#';

        if (btn.getAttribute('aria-selected') === 'true') {
          link.classList.add('active-tab-link');
        }

        link.addEventListener('click', (e) => {
          e.preventDefault();
          switchTab(btnIndex);
          const activeDialog = document.querySelector('dialog[open]');
          if (activeDialog) activeDialog.close();
        });

        li.appendChild(link);
        list.appendChild(li);
      });

      modalContainer.appendChild(list);

      const { showModal } = await createModal([modalContainer]);
      showModal();
    });
  });

  btnPrev.addEventListener('click', (e) => {
    e.preventDefault();
    if (!btnPrev.disabled) {
      switchTab(currentIndex - 1);
    }
  });

  btnNext.addEventListener('click', (e) => {
    e.preventDefault();
    if (!btnNext.disabled) {
      switchTab(currentIndex + 1);
    }
  });
}

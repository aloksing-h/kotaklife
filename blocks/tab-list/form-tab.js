/**
 * Apply Find a Plan variant classes without moving authored content.
 * @param {Element} block The tab-list block
 */
export default function decorateFormTab(block) {
  const originalTabButtons = block.querySelectorAll('button[role="tab"]');
  const tabPanels = block.querySelectorAll('div[role="tabpanel"]');
  const tablistWrapper = block.querySelector('.tablist-wrapper');

  // --- NEW FIX: Correct DOM structure on first load ---
  if (tablistWrapper) {
    tabPanels.forEach((panel) => {
      if (panel.parentElement && panel.parentElement.tagName.toUpperCase() === 'LI') {
        tablistWrapper.appendChild(panel);
      }
    });
  }

  // STRIP EXISTING HOVER LISTENERS:
  const tabButtons = Array.from(originalTabButtons).map((button) => {
    const cleanButton = button.cloneNode(true);
    button.parentNode.replaceChild(cleanButton, button);
    return cleanButton;
  });

  // --- FETCH AUTHORED NAV FROM LAST TAB PANEL ---
  const lastPanel = tabPanels[tabPanels.length - 1];

  const authoredPrev = lastPanel ? (lastPanel.querySelector('a[title="Previous"]') || Array.from(lastPanel.querySelectorAll('a')).find((a) => a.textContent.includes('Previous'))) : null;
  const authoredNext = lastPanel ? (lastPanel.querySelector('a[title="Next"]') || Array.from(lastPanel.querySelectorAll('a')).find((a) => a.textContent.includes('Next'))) : null;

  // Inject Mobile Arrow Navigation
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

  // Centralized function to switch tabs
  const switchTab = (index) => {
    if (index < 0 || index >= tabButtons.length) return;
    currentIndex = index;

    tabButtons.forEach((btn, i) => {
      const isTarget = i === index;

      // Manage mobile visibility class on the parent LI
      const li = btn.closest('li');
      if (li) {
        if (isTarget) {
          li.classList.add('mobile-active-step');
        } else {
          li.classList.remove('mobile-active-step');
        }
      }

      // Update accessibility states
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

    // Apply disabled state instead of hiding
    btnPrev.disabled = currentIndex === 0;
    btnNext.disabled = currentIndex === tabButtons.length - 1;
  };

  // 1. Initialize Default State
  const activeIndex = tabButtons.findIndex((btn) => btn.getAttribute('aria-selected') === 'true');
  switchTab(activeIndex > -1 ? activeIndex : 0);

  // 2. Desktop Tab Click Listener
  tabButtons.forEach((button, i) => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const isAlreadyActive = button.getAttribute('aria-selected') === 'true';

      if (!isAlreadyActive) {
        switchTab(i);
      } else {
        // Toggle off if clicking the already open tab (Leaves the mobile-active-step class intact)
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
  });

  // 3. Mobile Arrow Click Listeners
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

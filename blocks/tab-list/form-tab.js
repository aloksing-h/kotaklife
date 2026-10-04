import { createModal } from '../../blocks/modal/modal.js'; 

function addLongPressListener(element, callback, duration = 600) {
  let timer;

  const start = (e) => {
    if (!window.matchMedia('(max-width: 767px)').matches) {
      return; 
    }

    if (e.type === 'mousedown' && e.button !== 0) return; 
    
    timer = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50);
      callback(e);
    }, duration);
  };

  const cancel = () => {
    clearTimeout(timer);
  };

  element.addEventListener('touchstart', start, { passive: true });
  element.addEventListener('touchend', cancel);
  element.addEventListener('touchmove', cancel, { passive: true });

  element.addEventListener('mousedown', start);
  element.addEventListener('mouseup', cancel);
  element.addEventListener('mouseleave', cancel);
  element.addEventListener('mousemove', cancel);
  
  element.addEventListener('contextmenu', (e) => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      e.preventDefault();
    }
  });
}

export default function decorateFormTab(block) {
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

        // Replaced inline styles with a class assignment
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
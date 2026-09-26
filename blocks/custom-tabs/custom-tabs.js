let tabsIndex = 0;

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function setPanelState(button, panel, selected) {
  button.setAttribute('aria-selected', selected);
  button.setAttribute('aria-expanded', selected);
  panel.setAttribute('aria-hidden', !selected);
  panel.toggleAttribute('hidden', !selected);
}

function activateTab(button, buttons, panels, mobile) {
  const index = Number(button.dataset.tabIndex);
  const isSelected = button.getAttribute('aria-selected') === 'true';

  if (mobile && isSelected) {
    setPanelState(button, panels[index], false);
    return;
  }

  buttons.forEach((tab, tabIndex) => {
    setPanelState(tab, panels[tabIndex], tabIndex === index);
  });
}

/**
 * Decorate a custom-tabs block and its following custom tab sections.
 * @param {Element} block The custom-tabs block
 */
export default function decorate(block) {
  const section = block.closest('.section');
  if (!section) return;

  const panels = [];
  let nextSection = section.nextElementSibling;
  while (nextSection?.classList.contains('custom-tabs-panel')) {
    const title = nextSection.dataset.tabTitle?.trim();
    if (title) panels.push({ title, element: nextSection });
    nextSection = nextSection.nextElementSibling;
  }
  if (!panels.length) return;

  const prefix = `custom-tabs-${(tabsIndex += 1)}`;
  const mobile = !window.matchMedia('(min-width: 900px)').matches;
  const items = panels.map(({ title }, index) => (
    '<li><button class="custom-tabs-trigger" type="button" role="tab" '
    + `id="${prefix}-tab-${index}" aria-controls="${prefix}-panel-${index}" `
    + 'aria-selected="false" aria-expanded="false" tabindex="-1" '
    + `data-tab-index="${index}">${escapeHtml(title)}</button></li>`
  )).join('');

  block.innerHTML = '<div class="custom-tabs-wrapper">'
    + '<ul class="custom-tabs-list" role="tablist" aria-label="Tabbed content">'
    + `${items}</ul><div class="custom-tabs-panels"></div></div>`;

  const tabList = block.querySelector('[role="tablist"]');
  const panelContainer = block.querySelector('.custom-tabs-panels');
  const buttons = [...tabList.querySelectorAll('[role="tab"]')];
  const panelElements = panels.map(({ element }, index) => {
    const item = buttons[index].parentElement;
    element.id = `${prefix}-panel-${index}`;
    element.classList.add('custom-tabs-panel');
    element.setAttribute('role', 'tabpanel');
    element.setAttribute('aria-labelledby', buttons[index].id);
    element.tabIndex = -1;
    item.append(buttons[index]);

    if (mobile) item.append(element);
    else panelContainer.append(element);
    return element;
  });

  buttons.forEach((button) => {
    button.addEventListener('click', () => activateTab(button, buttons, panelElements, mobile));
    if (!mobile) {
      button.addEventListener('mouseenter', () => {
        activateTab(button, buttons, panelElements, false);
      });
    }
  });

  tabList.addEventListener('keydown', (event) => {
    const currentIndex = buttons.indexOf(document.activeElement);
    if (currentIndex < 0) return;

    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % buttons.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = buttons.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    buttons[currentIndex].tabIndex = -1;
    buttons[nextIndex].tabIndex = 0;
    buttons[nextIndex].focus();
    buttons[nextIndex].click();
  });

  buttons[0].tabIndex = 0;
  if (!mobile) activateTab(buttons[0], buttons, panelElements, false);
  else buttons.forEach((button, index) => setPanelState(button, panelElements[index], false));
}

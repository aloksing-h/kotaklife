import { loadCSS } from '../../scripts/aem.js';

const storageKey = 'kotak-accessibility-preferences';

function readPreferences() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || {};
  } catch (error) {
    return {};
  }
}

function writePreference(name, value) {
  const preferences = readPreferences();
  preferences[name] = value;
  localStorage.setItem(storageKey, JSON.stringify(preferences));
}

function setPreference(name, value) {
  document.documentElement.classList.toggle(`a11y-${name}`, value);
  writePreference(name, value);
}

function applyPreferences() {
  const preferences = readPreferences();
  Object.entries(preferences).forEach(([name, value]) => {
    document.documentElement.classList.toggle(`a11y-${name}`, value);
  });
}

function getFirstFoldElement(block) {
  const main = block.closest('main');
  if (!main) return null;

  return main.querySelector('.banner-container, .banner-v2-container, .hero-container, .video-banner-container')
    || main.querySelector(':scope > .section');
}

function showButtonAfterFirstFold(block, button, closePanel) {
  const firstFoldElement = getFirstFoldElement(block);
  if (!firstFoldElement) return;

  const updateButtonVisibility = () => {
    const firstFoldBottom = firstFoldElement.getBoundingClientRect().bottom + window.scrollY;
    const isBeforeFold = window.scrollY < firstFoldBottom;
    button.classList.toggle('is-before-fold', isBeforeFold);
    button.setAttribute('aria-hidden', isBeforeFold ? 'true' : 'false');
    button.tabIndex = isBeforeFold ? -1 : 0;
    if (isBeforeFold) closePanel();
  };

  updateButtonVisibility();
  window.addEventListener('scroll', updateButtonVisibility, { passive: true });
  window.addEventListener('resize', updateButtonVisibility);
}

function createPanel(button) {
  const panel = document.createElement('aside');
  panel.className = 'accessibility-button-panel';
  panel.id = 'accessibility-button-panel';
  panel.hidden = true;
  panel.setAttribute('aria-labelledby', 'accessibility-button-title');
  panel.innerHTML = `
    <div class="accessibility-button-panel-header">
      <h2 id="accessibility-button-title">Accessibility options</h2>
      <button class="accessibility-button-close" type="button" aria-label="Close accessibility options">×</button>
    </div>
    <div class="accessibility-button-options">
      <button type="button" data-a11y-option="contrast">High contrast</button>
      <button type="button" data-a11y-option="large-text">Larger text</button>
      <button type="button" data-a11y-option="underline-links">Underline links</button>
      <button type="button" data-a11y-option="reduced-motion">Reduce motion</button>
      <button type="button" data-a11y-option="reset">Reset settings</button>
    </div>
  `;
  document.body.append(panel);

  const close = () => {
    panel.hidden = true;
    button.setAttribute('aria-expanded', 'false');
  };
  const open = () => {
    panel.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    panel.querySelector('button')?.focus();
  };

  button.addEventListener('click', () => {
    if (panel.hidden) open();
    else close();
  });
  button.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
  button.setAttribute('aria-controls', panel.id);
  panel.querySelector('.accessibility-button-close').addEventListener('click', close);
  panel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      close();
      button.focus();
    }
  });
  panel.querySelectorAll('[data-a11y-option]').forEach((option) => {
    option.addEventListener('click', () => {
      const name = option.dataset.a11yOption;
      if (name === 'reset') {
        const preferences = readPreferences();
        localStorage.removeItem(storageKey);
        Object.keys(preferences).forEach((preference) => {
          document.documentElement.classList.remove(`a11y-${preference}`);
        });
      } else {
        setPreference(name, !document.documentElement.classList.contains(`a11y-${name}`));
      }
    });
  });

  return { close };
}

export default async function decorate(block) {
  await loadCSS(`${window.hlx.codeBasePath}/blocks/accessibility-button/accessibility-button.css`);
  const image = block.querySelector('picture img, img');
  const imageAlt = block.querySelector(':scope > div:nth-child(2)')?.textContent.trim()
    || image?.alt
    || 'Accessibility options';
  const buttonLabel = block.querySelector(':scope > div:nth-child(4)')?.textContent.trim()
    || imageAlt;
  const position = block.classList.contains('position-right') ? 'right' : 'left';
  const button = document.createElement('button');
  button.className = `accessibility-button-control position-${position}`;
  button.type = 'button';
  button.setAttribute('aria-label', buttonLabel);
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'accessibility-button-title');

  const icon = image || document.createElement('img');
  if (!image) icon.src = `${window.hlx.codeBasePath}/icons/accessibility-button.svg`;
  icon.alt = imageAlt;
  icon.width = 28;
  icon.height = 28;
  button.append(icon);
  block.replaceChildren(button);

  const panelControls = createPanel(button);
  showButtonAfterFirstFold(block, button, panelControls.close);
  button.addEventListener('dblclick', () => {
    button.classList.toggle('position-left');
    button.classList.toggle('position-right');
    block.classList.toggle('position-left');
    block.classList.toggle('position-right');
    panelControls.close();
  });
  applyPreferences();
}

import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';

/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to?.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks() {
  try {
    // TODO: add auto block, if needed
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
export function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Decorates hero-banner sections: wraps the meta icon + trailing text into a
 * `.hero-badge` pill and wires up the "Get Lumpsum Return" style dropdown lists.
 * @param {Element} main The main element
 */
function decorateHeroBanner(main) {
  main.querySelectorAll('.section.hero-banner').forEach((section) => {
    const wrapper = section.querySelector(':scope > .default-content-wrapper') || section;

    // 1. Badge Pill Handling
    const metaIcon = wrapper.querySelector(':scope > p > .icon');
    if (metaIcon) {
      const p = metaIcon.closest('p');
      const badge = document.createElement('span');
      badge.className = 'hero-badge';
      while (metaIcon.nextSibling) badge.append(metaIcon.nextSibling);
      badge.prepend(metaIcon);
      p.append(badge);
    }

    // 2. Dropdown Lists Handling
    const dropdowns = [...wrapper.querySelectorAll(':scope > ul > li')]
      .filter((li) => li.querySelector(':scope > ul'));
    if (!dropdowns.length) return;

    const closeAll = (except) => {
      dropdowns.forEach((li) => {
        if (li === except) return;
        li.classList.remove('is-open');
        const trigger = li.querySelector('.hero-dropdown-trigger');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      });
    };

    dropdowns.forEach((li) => {
      const panel = li.querySelector(':scope > ul');
      if (!panel) return;

      li.classList.add('hero-dropdown');
      panel.classList.add('hero-dropdown-panel');

      // Find the trigger content (link or paragraph)
      const existingTriggerNode = li.querySelector(':scope > a, :scope > p');
      const triggerP = document.createElement('p');
      triggerP.className = 'hero-dropdown-trigger';
      triggerP.setAttribute('role', 'button');
      triggerP.setAttribute('tabindex', '0');
      triggerP.setAttribute('aria-expanded', 'false');

      // Preserve label text
      const labelText = existingTriggerNode
        ? existingTriggerNode.textContent.trim()
        : li.firstChild.textContent.trim();
      triggerP.textContent = labelText;

      // Add Chevron Icon Span
      const chevronIcon = document.createElement('span');
      chevronIcon.className = 'icon icon-chevron-down';
      triggerP.appendChild(chevronIcon);

      // Replace old trigger element with new interactive trigger paragraph
      if (existingTriggerNode) {
        existingTriggerNode.replaceWith(triggerP);
      } else {
        li.insertBefore(triggerP, panel);
      }

      // 3. Decorate Sub-Menu Items with Icons
      [...panel.querySelectorAll(':scope > li')].forEach((subLi, index) => {
        const link = subLi.querySelector('a');
        if (link) {
          const text = link.textContent.trim();
          const { href } = link;
          const iconName = index === 0 ? 'economic-crisis' : `economic-crisis${index}`;
          subLi.innerHTML = `<a href="${href}"><span class="icon icon-${iconName}"></span>${text}</a>`;
        }
      });

      // 4. Interaction Logic
      const toggle = () => {
        const isOpen = !li.classList.contains('is-open');
        closeAll(li);
        li.classList.toggle('is-open', isOpen);
        triggerP.setAttribute('aria-expanded', String(isOpen));
      };

      triggerP.addEventListener('click', (e) => {
        e.stopPropagation();
        toggle();
      });

      triggerP.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        } else if (e.key === 'Escape') {
          closeAll();
        }
      });
    });

    // Close when clicking outside section
    document.addEventListener('click', (e) => {
      if (!section.contains(e.target)) closeAll();
    });

    // Render icon SVG graphics dynamically
    decorateIcons(section);
  });
}



/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
  decorateHeroBanner(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();

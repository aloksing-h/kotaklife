import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import dataMapKotakObj from '../../scripts/constant.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;

    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
      document.body.classList.remove('no-scroll');
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;

    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
      document.body.classList.remove('no-scroll');
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  if (navSections) {
    const navDrops = navSections.querySelectorAll('.nav-drop');
    if (isDesktop.matches) {
      navDrops.forEach((drop) => {
        if (!drop.hasAttribute('tabindex')) {
          drop.setAttribute('tabindex', 0);
          drop.addEventListener('focus', focusNavSection);
        }
      });
    } else {
      navDrops.forEach((drop) => {
        drop.removeAttribute('tabindex');
        drop.removeEventListener('focus', focusNavSection);
      });
    }
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

/**
 * Checks if a path is a fragment path that should be loaded dynamically
 * @param {string} path The URL path to check
 * @returns {boolean} True if the path is a fragment path
 */
function isFragmentPath(path) {
  if (!path) return false;
  return path.includes('/nav/fragment/') || path.includes('/content/kotak-life/nav/fragment/');
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    // --- Section 1: Data Indexing and Button Cleanup (from your snippet) ---

    // Set up the class prefixes for your dataMapKotakObj utility.
    if (typeof dataMapKotakObj !== 'undefined' && dataMapKotakObj.addIndexed) {
      dataMapKotakObj.CLASS_PREFIXES = [
        'navbrand-cont',
        'navbrand-sec',
        'navbrand-sub',
        'navbrand-inner-net',
        'navbrand-list',
        'navbrand-list-content',
      ];
      dataMapKotakObj.addIndexed(navBrand);
    }
    const brandLink = navBrand.querySelector('.button');
    if (brandLink) {
      brandLink.className = '';
      brandLink.closest('.button-container').className = '';
    }
  }

  const navSections = nav.querySelector('.nav-sections');
  let leaveTimer = null; // Timer for delayed menu closing

  if (navSections) {
    // Add data indexing for nav-sections
    if (typeof dataMapKotakObj !== 'undefined' && dataMapKotakObj.addIndexed) {
      dataMapKotakObj.CLASS_PREFIXES = [
        'nav-sec',
        'nav-sub',
        'nav-inner',
        'nav-list',
        'nav-content',
      ];
      dataMapKotakObj.addIndexed(navSections);
    }

    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach(async (navSection) => {
      if (navSection.querySelector('ul')) {
        navSection.classList.add('nav-drop');
        navSection.removeAttribute('aria-expanded');
        navSection.removeAttribute('tabindex');

        // Check if this nav-drop has a fragment link
        const firstLink = navSection.querySelector('ul li a');
        const fragmentHref = firstLink ? firstLink.getAttribute('href') : null;
        const hasFragmentLink = isFragmentPath(fragmentHref);

        // Load fragment on initialization if it's a fragment path
        if (hasFragmentLink) {
          const linkLi = firstLink.closest('li');
          const fragmentContent = await loadFragment(fragmentHref);

          if (fragmentContent) {
            // Create fragment container
            const fragmentContainer = document.createElement('div');
            fragmentContainer.className = 'nav-fragment-container';
            fragmentContainer.setAttribute('data-fragment-path', fragmentHref);

            // Add fragment content
            while (fragmentContent.firstChild) {
              fragmentContainer.appendChild(fragmentContent.firstChild);
            }

            // Remove the original link from DOM completely
            firstLink.remove();

            // Append fragment container to li
            linkLi.appendChild(fragmentContainer);

            // Prevent clicks inside fragment from bubbling up
            fragmentContainer.addEventListener('click', (e) => {
              e.stopPropagation();
            });
          }
        }
      }

      // --- Desktop Hover Logic ---
      navSection.addEventListener('mouseenter', () => {
        if (isDesktop.matches) {
          // Cancel any pending timer to close a menu
          clearTimeout(leaveTimer);

          // Close all other menus first
          toggleAllNavSections(navSections, false);

          // Prevent body scrolling while menu is open
          document.body.classList.add('no-scroll');

          // Open current menu
          if (navSection.querySelector('ul')) {
            navSection.setAttribute('aria-expanded', 'true');
            navSection.setAttribute('data-aria-expanded', 'true');
          }
        }
      });

      // --- Desktop Mouse Leave Logic ---
      navSection.addEventListener('mouseleave', () => {
        if (isDesktop.matches) {
          // Set a timer to close the menu after a delay
          leaveTimer = setTimeout(() => {
            navSection.setAttribute('aria-expanded', 'false');
            navSection.setAttribute('data-aria-expanded', 'false');
            document.body.classList.remove('no-scroll');
          }, 300); // 300ms delay before closing
        }
      });

      // --- Mobile Click Logic ---
      navSection.addEventListener('click', (e) => {
        // Don't close if clicking inside the fragment container
        const clickedInsideFragment = e.target.closest('.nav-fragment-container');
        if (clickedInsideFragment) {
          return; // Allow interaction with fragment content
        }

        if (!isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });

    // Close all menus when mouse leaves the entire nav sections area
    navSections.addEventListener('mouseleave', () => {
      if (isDesktop.matches) {
        leaveTimer = setTimeout(() => {
          toggleAllNavSections(navSections, false);
          document.body.classList.remove('no-scroll');
        }, 300);
      }
    });

    // Cancel timer when mouse re-enters nav sections
    navSections.addEventListener('mouseenter', () => {
      if (isDesktop.matches) {
        clearTimeout(leaveTimer);
      }
    });
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}

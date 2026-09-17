import { getMetadata } from '../../scripts/aem.js';
// eslint-disable-next-line import/no-cycle
import { loadFragment } from '../fragment/fragment.js';
// import { dataMapKotakObj } from '../../scripts/constant.js';

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
    e.preventDefault(); // Prevent default scroll on Space (WCAG 2.2 - 2.1.1 Keyboard)
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
 * Closes all nested .list-inner items - sets aria-expanded to false for all .list-inner elements
 * @param {Element} navSections The nav sections container
 */
function closeAllListInnerItems(navSections) {
  if (!navSections) return;
  // Set all .list-inner elements to aria-expanded="false"
  navSections.querySelectorAll('.list-inner').forEach((listInner) => {
    listInner.setAttribute('aria-expanded', 'false');
  });
}

/**
 * Resets all tabs inside a nav-drop to their initial closed state
 * @param {Element} navDrop The nav-drop element
 */
function resetTabsInNavDrop(navDrop) {
  if (!navDrop) return;
  
  // Find all tabs inside this nav-drop
  const tabs = navDrop.querySelectorAll('[role="tab"]');
  tabs.forEach((tab) => {
    // Reset tab state
    tab.setAttribute('aria-selected', 'false');
    tab.setAttribute('aria-expanded', 'false');
    
    // Hide all associated panels
    const panelIds = (tab.getAttribute('aria-controls') || '').split(' ').filter(Boolean);
    panelIds.forEach((panelId) => {
      const panel = document.querySelector(`#${CSS.escape(panelId)}`);
      if (panel) {
        panel.setAttribute('hidden', '');
        panel.classList.add('hidden');
        panel.setAttribute('aria-hidden', 'true');
      }
    });
  });
}

/**
 * Shows the first tab inside a nav-drop (for desktop)
 * @param {Element} navDrop The nav-drop element
 */
function showFirstTabInNavDrop(navDrop) {
  if (!navDrop) return;
  
  // Find all tabs inside this nav-drop
  const tabs = navDrop.querySelectorAll('[role="tab"]');
  if (tabs.length === 0) return;
  
  // Reset all tabs first
  tabs.forEach((tab) => {
    tab.setAttribute('aria-selected', 'false');
    tab.setAttribute('aria-expanded', 'false');
    
    // Hide all associated panels
    const panelIds = (tab.getAttribute('aria-controls') || '').split(' ').filter(Boolean);
    panelIds.forEach((panelId) => {
      const panel = document.querySelector(`#${CSS.escape(panelId)}`);
      if (panel) {
        panel.setAttribute('hidden', '');
        panel.classList.add('hidden');
        panel.setAttribute('aria-hidden', 'true');
      }
    });
  });
  
  // Now show the first tab
  const firstTab = tabs[0];
  firstTab.setAttribute('aria-selected', 'true');
  firstTab.setAttribute('aria-expanded', 'true');
  firstTab.setAttribute('aria-current', 'true');
  
  // Show the first tab's associated panels
  const panelIds = (firstTab.getAttribute('aria-controls') || '').split(' ').filter(Boolean);
  panelIds.forEach((panelId) => {
    const panel = document.querySelector(`#${CSS.escape(panelId)}`);
    if (panel) {
      panel.removeAttribute('hidden');
      panel.classList.remove('hidden');
      panel.setAttribute('aria-hidden', 'false');
    }
  });
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
    // Update aria-label for screen readers to announce state
    const button = section.querySelector('button');
    if (button) {
      button.setAttribute('aria-expanded', expanded);
      // Announce state change to assistive technologies
      section.setAttribute('aria-busy', 'false');
    }
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

  // On mobile, when opening hamburger (expanded = false means about to open),
  // close all .list-inner items
  if (!isDesktop.matches && !expanded) {
    closeAllListInnerItems(navSections);
  }

  // Update button aria-label for screen readers (WCAG 2.2 - 1.3.1 Info and Relationships)
  button.setAttribute('aria-label', expanded ? 'Open navigation menu' : 'Close navigation menu');
  button.setAttribute('aria-pressed', expanded ? 'false' : 'true');

  // enable nav dropdown keyboard accessibility
  if (navSections) {
    const navDrops = navSections.querySelectorAll('.nav-drop');
    if (isDesktop.matches) {
      navDrops.forEach((drop) => {
        if (!drop.hasAttribute('tabindex')) {
          drop.setAttribute('tabindex', 0);
          drop.setAttribute('role', 'button');
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
    // collapse menu on focus lost (ONLY ON DESKTOP, not on mobile)
    if (isDesktop.matches) {
      nav.addEventListener('focusout', closeOnFocusLost);
    }
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    if (isDesktop.matches) {
      nav.removeEventListener('focusout', closeOnFocusLost);
    }
  }
}

function isFragmentPath(path) {
  if (!path) return false;
  // Check for fragment paths in any structure (e.g., /in/en/fragment/nav/*, /fragment/*, etc.)
  return path.includes('/fragment/');
}

/**
 * Adds layer classes recursively to elements
 * @param {Element} element The element to add classes to
 * @param {Object} classNameMap Class name mapping for each depth level
 * @param {Number} depth The current depth level (internal use)
 */
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
 * Maps sections with tab classes to their corresponding tab panels
 * @param {Element} container The fragment container element
 */
// function mapTabSectionsToTabPanels(container) {
//   if (!container) return;

//   // Find the tabs block within the container
//   const tabsBlock = container.querySelector('.tabs.block');
//   if (!tabsBlock) return;

//   // Get all tab panels
//   const tabPanels = Array.from(tabsBlock.querySelectorAll('.tabs-panel'));
//   if (tabPanels.length === 0) return;

//   // Define mapping patterns: tab-one -> first panel, tab-two -> second panel, etc.
//   const tabClassPatterns = ['tab-one', 'tab-two', 'tab-three', 'tab-four', 'tab-five', 'tab-six', 'tab-seven', 'tab-eight', 'tab-nine', 'tab-ten'];

//   tabClassPatterns.forEach((tabClass, index) => {
//     // Find sections with this tab class
//     const tabSections = container.querySelectorAll(`.${tabClass}.section`);

//     if (tabSections.length > 0 && tabPanels[index]) {
//       tabSections.forEach((section) => {
//         // Clone or move the section content into the corresponding tab panel
//         // We'll append the section's children to maintain the content structure
//         const wrapper = section.querySelector('.columns-wrapper, .default-content-wrapper');
//         if (wrapper) {
//           // Append the wrapper content to the tab panel
//           tabPanels[index].appendChild(wrapper.cloneNode(true));
//           // Optionally remove the original section to avoid duplication
//           section.remove();
//         }
//       });
//     }
//   });
// }

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
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Main navigation');
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['header-top', 'brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  // Move white/grey color class from first section to nav
  const firstSection = nav.children[0];
  if (firstSection) {
    const colorClass = Array.from(firstSection.classList).find(
      (cls) => cls === 'white-nav' || cls === 'grey-nav',
    );
    if (colorClass) {
      nav.classList.add(colorClass);
      firstSection.classList.remove(colorClass);
    }
  }

  // Apply layer classes to topHeader
  const topHeader = nav.querySelector('.nav-header-top .default-content-wrapper');
  if (topHeader) {
    addLayerClasses(topHeader, {
      1: 'list-item',
      2: 'list-inner',
      3: 'inner-child',
      4: 'inner-item',
      5: 'item',
      6: 'item-child',
    });
  }

  // Apply layer classes to topHeader
  const navSection = nav.querySelector('.nav-sections .default-content-wrapper');
  if (navSection) {
    addLayerClasses(navSection, {
      1: 'list-item',
      2: 'list-inner',
      3: 'inner-child',
      4: 'inner-item',
      5: 'item',
      6: 'item-child',
    });
  }

  // Initialize all .list-inner elements with aria-expanded="false"
  const allListInner = nav.querySelectorAll('.list-inner');
  allListInner.forEach((listInner) => {
    listInner.setAttribute('aria-expanded', 'false');
  });

  // Handle header-top list-inner click functionality (both mobile and desktop)
  // Only target specific list-inner items: list-inner-1, list-inner-2, and list-inner-4
  const headerTopListInners = nav.querySelectorAll(
    '.nav-header-top .list-item-1 > .list-inner-1, '
    + '.nav-header-top .list-item-2 > .list-inner-2, '
    + '.nav-header-top .list-item-2 > .list-inner-4',
  );
  if (headerTopListInners.length > 0) {
    // Add click listeners to these specific list-inner items
    headerTopListInners.forEach((listInner) => {
      listInner.addEventListener('click', (e) => {
        e.stopPropagation();
        // Check if the clicked item already has the active class
        const isAlreadyActive = listInner.classList.contains('active');
        // Remove active class from all these specific list-inner items
        headerTopListInners.forEach((item) => {
          item.classList.remove('active');
        });
        // If it wasn't active, add active class to clicked item (toggle behavior)
        if (!isAlreadyActive) {
          listInner.classList.add('active');
        }
      });
    });

    // Add click listener on document to remove active class when clicking outside
    document.addEventListener('click', (e) => {
      // Check if click is outside all these specific header-top list-inner items
      const isClickInsideListInner = Array.from(headerTopListInners).some(
        (item) => item.contains(e.target),
      );
      if (!isClickInsideListInner) {
        // Remove active class from all these items
        headerTopListInners.forEach((item) => {
          item.classList.remove('active');
        });
      }
    });
  }

  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    // --- Section 1: Data Indexing and Button Cleanup (from your snippet) ---

    // Set up the class prefixes for your dataMapKotakObj utility.
    // if (typeof dataMapKotakObj !== 'undefined' && dataMapKotakObj.addIndexed) {
    //   dataMapKotakObj.CLASS_PREFIXES = [
    //     'navbrand-cont',
    //     'navbrand-sec',
    //     'navbrand-sub',
    //     'navbrand-inner-net',
    //     'navbrand-list',
    //     'navbrand-list-content',
    //   ];
    //   dataMapKotakObj.addIndexed(navBrand);
    // }
    const brandLink = navBrand.querySelector('.button');
    if (brandLink) {
      brandLink.className = '';
      brandLink.closest('.button-container').className = '';
      // Ensure brand link has alt text if it's an image (WCAG 2.2 - 1.1.1 Non-text Content)
      const brandImg = brandLink.querySelector('img');
      if (brandImg && !brandImg.getAttribute('alt')) {
        brandImg.setAttribute('alt', 'Company Logo');
      }
    }
  }

  const navSections = nav.querySelector('.nav-sections');
  let leaveTimer = null; // Timer for delayed menu closing

  if (navSections) {
    // Add proper ARIA attributes to nav-sections (WCAG 2.2 - 4.1.2 Name, Role, Value)
    navSections.setAttribute('role', 'menubar');

    // Get the last li from nav-sections once and extract its text
    const navSectionsUl = navSections.querySelector('.default-content-wrapper > ul');
    let categoryText = '';
    if (navSectionsUl) {
      const allLis = Array.from(navSectionsUl.children);
      const lastLi = allLis[allLis.length - 1];
      if (lastLi) {
        categoryText = lastLi.textContent.trim();
        lastLi.remove();
      }
    }

    // Add data indexing for nav-sections
    // if (typeof dataMapKotakObj !== 'undefined' && dataMapKotakObj.addIndexed) {
    //   dataMapKotakObj.CLASS_PREFIXES = [
    //     'nav-sec',
    //     'nav-sub',
    //     'nav-inner',
    //     'nav-list',
    //     'nav-content',
    //   ];
    //   dataMapKotakObj.addIndexed(navSections);
    // }

    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach(async (navDrop) => {
      if (navDrop.querySelector('ul')) {
        navDrop.classList.add('nav-drop');
        navDrop.removeAttribute('aria-expanded');
        navDrop.removeAttribute('tabindex');

        // Set proper ARIA attributes for dropdown (WCAG 2.2 - 4.1.2 Name, Role, Value)
        navDrop.setAttribute('role', 'listitem');
        const dropButton = navDrop.querySelector('a') || navDrop.querySelector('button');
        if (dropButton) {
          dropButton.setAttribute('aria-haspopup', 'true');
          dropButton.setAttribute('aria-expanded', 'false');
        }

        // Check if this nav-drop has a fragment link
        const firstLink = navDrop.querySelector('ul li a');
        const fragmentHref = firstLink ? firstLink.getAttribute('href') : null;
        const hasFragmentLink = isFragmentPath(fragmentHref);

        // Load fragment on initialization if it's a fragment path
        if (hasFragmentLink) {
          const linkLi = firstLink.closest('li');
          const fragmentContent = await loadFragment(fragmentHref);

          if (fragmentContent) {
            // Create fragment container with proper ARIA attributes
            const fragmentContainer = document.createElement('div');
            fragmentContainer.className = 'nav-fragment-container';
            fragmentContainer.setAttribute('data-fragment-path', fragmentHref);
            fragmentContainer.setAttribute('role', 'region');
            fragmentContainer.setAttribute('aria-label', 'Submenu content');

            // Add fragment content
            while (fragmentContent.firstChild) {
              fragmentContainer.appendChild(fragmentContent.firstChild);
            }

            // Remove the original link from DOM completely
            firstLink.remove();

            // Append fragment container to li
            linkLi.appendChild(fragmentContainer);

            // Handle tab list wrapper creation
            const tabListWrapper = fragmentContainer.querySelector('.tablist-wrapper');
            if (tabListWrapper) {
              const ulElement = tabListWrapper.querySelector('ul');
              if (ulElement) {
                // Create wrapper div
                const tabWrapper = document.createElement('div');
                tabWrapper.className = 'tab-wrapper';

                // Create h4 with the category text (from the last li of nav-sections)
                const heading = document.createElement('h4');
                heading.textContent = categoryText;

                // Append h4 to wrapper
                tabWrapper.appendChild(heading);

                // Move ul into wrapper
                tabWrapper.appendChild(ulElement);

                // Prepend wrapper into tablist-wrapper
                tabListWrapper.prepend(tabWrapper);
              }
            }

            // Prevent clicks inside fragment from bubbling up
            fragmentContainer.addEventListener('click', (e) => {
              e.stopPropagation();
            });

            // DESKTOP: Attach hover listeners directly to this fragment container
            // This ensures menu stays open when user moves to fragment content
            if (isDesktop.matches) {
              fragmentContainer.addEventListener('mouseenter', () => {
                clearTimeout(leaveTimer);
              });

              fragmentContainer.addEventListener('mouseleave', () => {
                leaveTimer = setTimeout(() => {
                  toggleAllNavSections(navSections, false);
                  document.body.classList.remove('no-scroll');
                }, 300);
              });
            }
            // // Map tab sections to their corresponding tab panels
            // mapTabSectionsToTabPanels(fragmentContainer);
          }
        }
      }

      // --- Desktop Hover Logic ---
      navDrop.addEventListener('mouseenter', () => {
        if (isDesktop.matches) {
          // Cancel any pending timer to close a menu
          clearTimeout(leaveTimer);

          // Close all other menus first
          toggleAllNavSections(navSections, false);

          // Prevent body scrolling while menu is open
          document.body.classList.add('no-scroll');

          // Open current menu
          if (navDrop.querySelector('ul')) {
            // Show first tab in tab-list on desktop
            showFirstTabInNavDrop(navDrop);
            navDrop.setAttribute('aria-expanded', 'true');
            navDrop.setAttribute('data-aria-expanded', 'true');
            // Update aria-haspopup button
            const dropButton = navDrop.querySelector('a') || navDrop.querySelector('button');
            if (dropButton) {
              dropButton.setAttribute('aria-expanded', 'true');
            }
          }
        }
      });

      // --- Desktop Mouse Leave Logic ---
      navDrop.addEventListener('mouseleave', () => {
        if (isDesktop.matches) {
          // Set a timer to close the menu after a delay
          leaveTimer = setTimeout(() => {
            navDrop.setAttribute('aria-expanded', 'false');
            navDrop.setAttribute('data-aria-expanded', 'false');
            // Update aria-haspopup button
            const dropButton = navDrop.querySelector('a') || navDrop.querySelector('button');
            if (dropButton) {
              dropButton.setAttribute('aria-expanded', 'false');
            }
            document.body.classList.remove('no-scroll');
          }, 300); // 300ms delay before closing
        }
      });

      // --- Mobile Click Logic ---
      navDrop.addEventListener('click', (e) => {
        if (!isDesktop.matches) {
          // Allow tab-list interactions without toggling nav-drop
          const clickedInsideTabList = e.target.closest('[role="tab"], [role="tablist"], .tablist-wrapper');
          if (clickedInsideTabList) {
            e.stopPropagation(); // Prevent hamburger from closing
            return; // Let tab handle the interaction
          }

          // Stop propagation to prevent hamburger from closing
          e.stopPropagation();

          // Toggle nav-drop for any other click inside it
          const expanded = navDrop.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navDrop.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          // Reset tabs when opening nav-drop
          if (!expanded) {
            resetTabsInNavDrop(navDrop);
          }
          // Update aria-haspopup button
          const dropButton = navDrop.querySelector('a') || navDrop.querySelector('button');
          if (dropButton) {
            dropButton.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          }
        }
      });
    });

    // Close all menus when mouse leaves the entire nav sections area
    // navSections.addEventListener('mouseleave', () => {
    //   if (isDesktop.matches) {
    //     leaveTimer = setTimeout(() => {
    //       toggleAllNavSections(navSections, false);
    //       document.body.classList.remove('no-scroll');
    //     }, 300);
    //   }
    // });

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
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation menu" aria-pressed="false">
      <span class="nav-hamburger-icon" aria-hidden="true"></span>
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

  // Handle desktop hamburger icon click to apply desk-hamburger class to modal
  const desktopHamburger = block.querySelector('.icon-desktop-hamburger');
  if (desktopHamburger) {
    const hamburgLink = desktopHamburger.closest('a');
    if (hamburgLink) {
      hamburgLink.addEventListener('click', (e) => {
        // Use setTimeout to ensure modal is loaded before applying class
        setTimeout(() => {
          const modal = document.querySelector('.modal.block');
          if (modal) {
            modal.classList.add('desk-hamburger');

            // Get the section inside modal
            const modalSection = modal.querySelector('.section');
            if (modalSection) {
              // Create nav-wrapper div
              const newNavWrapper = document.createElement('div');
              newNavWrapper.className = 'nav-wrapper';

              // Create nav-content div
              const navContent = document.createElement('ul');
              navContent.className = 'nav-content';

              // Get all nav-drop items from nav-sections
              const allNavDrops = Array.from(navSections.querySelectorAll('.nav-drop'));
              
              // Skip first 4 and get last 4
              const last4NavDrops = allNavDrops.slice(-4);

              // Clone and add first 2 nav-drops to nav-content
              last4NavDrops.slice(0, 2).forEach((navDrop) => {
                const clonedNavDrop = navDrop.cloneNode(true);
                navContent.appendChild(clonedNavDrop);
              });

              // Wrap last 2 nav-drops in a single li
              const last2NavDrops = last4NavDrops.slice(2, 4);
              if (last2NavDrops.length > 0) {
                const wrapperLi = document.createElement('li');
                wrapperLi.className = 'nav-drop-wrapper';

                // Create ul inside wrapper li
                const wrapperUl = document.createElement('ul');

                last2NavDrops.forEach((navDrop) => {
                  const clonedNavDrop = navDrop.cloneNode(true);
                  wrapperUl.appendChild(clonedNavDrop);
                });

                wrapperLi.appendChild(wrapperUl);
                navContent.appendChild(wrapperLi);
              }

              // Append nav-content to nav-wrapper
              newNavWrapper.appendChild(navContent);

              // Prepend nav-wrapper to section
              modalSection.prepend(newNavWrapper);
            }
          }
        }, 100);
      });
    }
  }
}

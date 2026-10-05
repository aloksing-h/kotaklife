import { toClassName } from '../../scripts/aem.js';
import decorateFindPlan from './find-plan.js';
import decorateFormTab from './form-tab.js';

let tabsIdx = 0;

export function updateTabIndicator(tabList = document.querySelector('.tab-list.calc-card [role="tablist"]'), isInitialMeasurement = false) {
  if (!tabList) return;
  const wrapper = tabList.closest('.tab-wrapper');
  const indicator = wrapper?.querySelector('.tab-indicator');
  const selectedTab = tabList.querySelector('[role="tab"][aria-selected="true"]');
  if (!indicator || !selectedTab) return;

  const mask = indicator.closest('.tab-mask');
  const isContents = mask && getComputedStyle(mask).display === 'contents';
  const positionRoot = isContents ? wrapper : mask || wrapper;
  const tabRect = selectedTab.getBoundingClientRect();
  const rootRect = positionRoot.getBoundingClientRect();
  const scrollLeft = mask && !isContents ? mask.scrollLeft : tabList.scrollLeft;
  const borderOffset = mask && !isContents ? mask.clientLeft : 0;
  const measuredLeft = tabRect.left - rootRect.left + scrollLeft - borderOffset;
  const initialWidthOffset = isInitialMeasurement
    ? (window.matchMedia('(max-width: 767px)').matches ? 8 : 3)
    : 0;
  indicator.style.left = `${isInitialMeasurement ? 0 : measuredLeft}px`;
  indicator.style.width = `${tabRect.width + initialWidthOffset}px`;

  const tabs = [...tabList.querySelectorAll(':scope > li > [role="tab"]')];
  const selectedIndex = tabs.indexOf(selectedTab);
  const previous = wrapper.querySelector('.paddle-prev');
  const next = wrapper.querySelector('.paddle-next');
  if (previous && next && selectedIndex >= 0) {
    previous.disabled = selectedIndex === 0;
    previous.classList.toggle('paddle-hidden', previous.disabled);
    next.disabled = selectedIndex === tabs.length - 1;
    next.classList.toggle('paddle-hidden', next.disabled);
  }
}

export function scrollTabIntoView(e) {
  const targetTab = e.currentTarget;
  const tabList = targetTab.closest('[role="tablist"]');
  if (!tabList) return;
  // Only auto-scroll on mobile where tabs can overflow and be hidden
  // const isMobile = !window.matchMedia('(min-width: 900px)').matches;
  // if (!isMobile) return;
  const scrollContainer = targetTab.closest('.tab-mask') || tabList;
  const listRect = scrollContainer.getBoundingClientRect();
  const tabRect = targetTab.getBoundingClientRect();
  if (tabList.closest('.tab-list.calc-card')) {
    const currentScroll = scrollContainer.scrollLeft;
    const maxScroll = Math.max(0, scrollContainer.scrollWidth - scrollContainer.clientWidth);
    const tabCenter = tabRect.left + tabRect.width / 2;
    const listCenter = listRect.left + listRect.width / 2;
    const centeredScroll = currentScroll + tabCenter - listCenter;
    const nextScroll = Math.max(0, Math.min(maxScroll, centeredScroll));
    scrollContainer.scrollBy({ left: nextScroll - currentScroll, behavior: 'smooth' });
    return;
  }

  const overflowLeft = tabRect.left - listRect.left;
  const overflowRight = listRect.right - tabRect.right;
  if (overflowLeft < 0) {
    scrollContainer.scrollBy({ left: overflowLeft - 16, behavior: 'smooth' });
  } else if (overflowRight < 0) {
    scrollContainer.scrollBy({ left: -overflowRight + 16, behavior: 'smooth' });
  }
}

export function changeTabs(e) {
  const targetTab = e.currentTarget;
  const targetTabPanelIds = (targetTab.getAttribute('aria-controls') || '')
    .split(' ')
    .filter(Boolean);
  if (!targetTabPanelIds.length) return;
  const [tabGroupPrefix] = targetTabPanelIds[0].split('-panel-');
  const tabList = targetTab.closest('[role="tablist"]');
  if (!tabList) return;
  // const isFindPlan = tabList.closest('.find-plan');
  // const mobileAccordion = !window.matchMedia('(min-width: 900px)').matches && !isFindPlan;
  const isHeaderTab = tabList.closest('.header-tab, header');
  const mobileAccordion = !window.matchMedia('(min-width: 900px)').matches && isHeaderTab;
  const isSelected = targetTab.getAttribute('aria-selected') === 'true';
  if (mobileAccordion && isSelected) {
    // Accordion: toggle off
    targetTab.setAttribute('aria-selected', 'false');
    targetTab.removeAttribute('aria-current');
    targetTabPanelIds.forEach((id) => {
      const panel = document.querySelector(`#${CSS.escape(id)}`);
      if (panel) {
        panel.setAttribute('aria-hidden', 'true');
        panel.setAttribute('hidden', '');
        panel.classList.add('hidden');
      }
    });
    return;
  }
  // Remove all current selected tabs
  tabList
    .querySelectorAll(':scope [role="tab"][aria-selected="true"]')
    .forEach((t) => {
      t.setAttribute('aria-selected', false);
      t.removeAttribute('aria-current');
    });
  // Set this tab as selected
  targetTab.setAttribute('aria-selected', true);
  targetTab.setAttribute('aria-current', 'true');
  // Hide all tab panels
  document
    .querySelectorAll(`[role="tabpanel"][id^="${tabGroupPrefix}-panel-"]`)
    .forEach((p) => {
      p.setAttribute('hidden', '');
      p.classList.add('hidden');
    });
  // Show the selected panel
  targetTabPanelIds.forEach((id) => {
    const panel = document.querySelector(`#${CSS.escape(id)}`);
    if (panel) {
      panel.removeAttribute('hidden');
      panel.classList.remove('hidden');
      panel.setAttribute('aria-hidden', 'false');
    }
  });
  if (tabList.closest('.tab-list.calc-card')) {
    scrollTabIntoView({ currentTarget: targetTab });
    updateTabIndicator(tabList);
  }
}
/**
 * Decorate the tab-list block.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/tab_role#example
 *
 * @param {Element} block the tab-list block
 */
export default async function decorate(block) {
  // find the tab panels and their labels that belong to this tab-list
  const tabPanels = [];
  const section = block.closest('.section');
  let nextSection = section.nextElementSibling;
  while (nextSection) {
    const { tabLabel, image } = nextSection.dataset;
    if (tabLabel) {
      tabPanels.push([tabLabel, nextSection, image]);
      nextSection = nextSection.nextElementSibling;
    } else {
      break;
    }
  }
  // create the tab-list DOM itself
  const tabsPrefix = `tabs-${(tabsIdx += 1)}`;
  const tabList = document.createElement('ul');
  tabList.role = 'tablist';
  tabList.id = `${tabsPrefix}-tablist`;
  // Add aria-label to describe the tab list (WCAG 2.2 - 1.3.1 Info and Relationships)
  tabList.setAttribute('aria-label', 'Tabbed content');

  const tabs = [];

  // Collect all authored style classes from tab-panels and apply to tab-list block
  // Also remove these classes from the tab-panel sections
  tabPanels.forEach(([, tabPanel]) => {
    tabPanel.classList.forEach((className) => {
      // Skip default AEM-generated classes
      if (!['section', 'tab-panel', 'default-content-wrapper', 'block'].includes(className)) {
        block.classList.add(className);
      }
    });
  });

  // Mobile accordion (panel inside li) applies only to header tabs
  const isMobile = !window.matchMedia('(min-width: 900px)').matches
    && (block.classList.contains('header-tab') || !!block.closest('header'));

  tabPanels.forEach(([tabLabel, tabPanel, image], i) => {
    const tabId = `${tabsPrefix}-tab-${toClassName(tabLabel)}-${i + 1}`;
    const tabPanelId = `${tabsPrefix}-panel-${toClassName(tabLabel)}-${i + 1}`;

    // Create the list item
    const li = document.createElement('li');

    // Build the tab button
    const tabItem = document.createElement('button');
    tabItem.id = tabId;
    tabItem.role = 'tab';
    tabItem.ariaSelected = i === 0;
    tabItem.ariaExpanded = i === 0; // Accordion state (WCAG 2.2 - 4.1.2 Name, Role, Value)
    tabItem.tabIndex = i === 0 ? 0 : -1;
    tabItem.setAttribute('aria-controls', tabPanelId);

    // Add image if available
    if (image) {
      const imgElement = document.createElement('img');
      // Extract just the path from the full URL (removes domain and query parameters)
      const [imageUrl] = image.split('?');
      imgElement.src = new URL(imageUrl).pathname;
      imgElement.alt = tabLabel;
      imgElement.classList.add('tab-image');
      tabItem.appendChild(imgElement);
    }

    // Add text content
    tabItem.appendChild(document.createTextNode(tabLabel));
    tabItem.addEventListener('click', changeTabs);
    // Keep find-plan tabs click-only; preserve hover activation for other variants.
    // if (!block.classList.contains('find-plan')
    //   && window.matchMedia('(min-width: 900px)').matches) {
    //   tabItem.addEventListener('mouseenter', changeTabs);
    // }
    // Add keyboard support for Enter/Space (WCAG 2.2 - 2.1.1 Keyboard)
    tabItem.addEventListener('keydown', (e) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        tabItem.click();
      }
    });

    // Append button to list item
    li.appendChild(tabItem);

    // Update the tab panel attributes
    tabPanel.id = tabPanelId;
    tabPanel.setAttribute('aria-labelledby', tabId);
    tabPanel.role = 'tabpanel';
    tabPanel.tabIndex = -1; // Allow programmatic focus on tab panels (WCAG 2.2 - 2.4.3 Focus Order)

    // Desktop behavior: first panel shown, others hidden
    if (i === 0 && !isMobile) {
      // Desktop: show first panel
      tabItem.setAttribute('aria-current', 'true');
      tabPanel.removeAttribute('hidden');
      tabPanel.classList.remove('hidden');
      tabPanel.setAttribute('aria-hidden', 'false');
    } else {
      // Mobile and non-first panels: all hidden initially
      tabPanel.setAttribute('hidden', '');
      tabPanel.classList.add('hidden');
      tabPanel.setAttribute('aria-hidden', 'true');
    }

    if (isMobile) {
      // Mobile: append panel inside li for accordion
      li.appendChild(tabPanel);
      // On mobile, deselect first tab and keep panel hidden
      tabItem.setAttribute('aria-selected', 'false');
      tabItem.setAttribute('aria-expanded', 'false');
    }

    // Append list item to tab list
    tabList.appendChild(li);

    // Store tab for later use
    tabs.push(tabItem);
  });

  // if the tab-list has the showall class, add a tab for all the tabs
  if (block.classList.contains('showall')) {
    const tabId = `${tabsPrefix}-tab-all`;
    const tabPanelIds = [...tabs]
      .map((t) => t.getAttribute('aria-controls'))
      .join(' ');
    // build the tabs as buttons and append them to the tab list
    const tabItem = document.createElement('button');
    tabItem.id = tabId;
    tabItem.role = 'tab';
    tabItem.tabIndex = 0;
    tabItem.setAttribute('aria-controls', tabPanelIds);
    tabItem.textContent = 'All';
    tabItem.addEventListener('click', changeTabs);
    const li = document.createElement('li');
    li.appendChild(tabItem);
    tabList.prepend(li);
    tabs.unshift(tabItem);
    // set tabIndex for the now second tab to -1
    tabs[1].tabIndex = -1;
    changeTabs({ currentTarget: tabItem });
  }
  // Enable arrow navigation between tabs in the tab list (WCAG 2.2 - 2.1.1 Keyboard)
  let tabFocus = 0;
  tabList.addEventListener('keydown', (e) => {
    // Move right
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      tabs[tabFocus].setAttribute('tabindex', -1);
      if (e.key === 'ArrowRight') {
        tabFocus += 1;
        // If we're at the end, go to the start
        if (tabFocus >= tabs.length) {
          tabFocus = 0;
        }
        // Move left
      } else if (e.key === 'ArrowLeft') {
        tabFocus -= 1;
        // If we're at the start, move to the end
        if (tabFocus < 0) {
          tabFocus = tabs.length - 1;
        }
      }
      tabs[tabFocus].setAttribute('tabindex', 0);
      tabs[tabFocus].focus();
      // Also activate the tab on arrow navigation for immediate feedback
      tabs[tabFocus].click();
    }
    // Home/End key support (WCAG 2.2 - 2.1.2 Keyboard (No Exception))
    if (e.key === 'Home') {
      e.preventDefault();
      tabs[tabFocus].setAttribute('tabindex', -1);
      tabFocus = 0;
      tabs[tabFocus].setAttribute('tabindex', 0);
      tabs[tabFocus].focus();
      tabs[tabFocus].click();
    } else if (e.key === 'End') {
      e.preventDefault();
      tabs[tabFocus].setAttribute('tabindex', -1);
      tabFocus = tabs.length - 1;
      tabs[tabFocus].setAttribute('tabindex', 0);
      tabs[tabFocus].focus();
      tabs[tabFocus].click();
    }
  });

  // Wrap tablist in tablist-wrapper container
  const tablistWrapper = document.createElement('div');
  tablistWrapper.className = 'tablist-wrapper';
  tablistWrapper.appendChild(tabList);

  // Append all tab panels (desktop panels) after the tablist
  if (!isMobile) {
    tabPanels.forEach(([, tabPanel]) => {
      tablistWrapper.appendChild(tabPanel);
    });
  }

  block.replaceChildren(tablistWrapper);
  if (block.classList.contains('find-plan')) decorateFindPlan(block);
  if (block.classList.contains('insurance-content-tab')) {
    decorateFormTab(block);
  }

  if (block.classList.contains('calc-card')) {
    const tabListWrapper = block.querySelector('.tablist-wrapper');
    const tabUl = tabListWrapper.querySelector('ul');
    const tabWrapper = document.createElement('div');
    tabWrapper.classList.add('tab-wrapper');
    const tabMask = document.createElement('div');
    tabMask.classList.add('tab-mask');
    tabMask.append(tabUl);
    const tabIndicator = document.createElement('div');
    tabIndicator.classList.add('tab-indicator');
    tabMask.append(tabIndicator);
    const tabPaddles = document.createElement('div');
    tabPaddles.classList.add('tab-paddles');
    const paddlePrev = document.createElement('button');
    paddlePrev.classList.add('paddle-btn', 'paddle-prev');
    paddlePrev.type = 'button';
    paddlePrev.setAttribute('aria-label', 'Previous item');
    paddlePrev.tabIndex = -1;
    const paddleNext = document.createElement('button');
    paddleNext.classList.add('paddle-btn', 'paddle-next');
    paddleNext.type = 'button';
    paddleNext.setAttribute('aria-label', 'Next item');
    paddleNext.tabIndex = -1;
    tabPaddles.append(paddlePrev, paddleNext);
    tabWrapper.append(tabMask, tabPaddles);
    tabListWrapper.prepend(tabWrapper);

    const activateAdjacentTab = (direction) => {
      const tabItems = [...tabUl.querySelectorAll(':scope > li > [role="tab"]')];
      const activeIndex = tabItems.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
      const adjacentTab = tabItems[activeIndex + direction];
      adjacentTab?.click();
    };
    paddlePrev.addEventListener('click', () => activateAdjacentTab(-1));
    paddleNext.addEventListener('click', () => activateAdjacentTab(1));
    tabMask.addEventListener('scroll', () => updateTabIndicator(tabUl), { passive: true });
    window.addEventListener('resize', () => updateTabIndicator(tabUl), { passive: true });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => updateTabIndicator(tabUl, true));
    });
  }
}

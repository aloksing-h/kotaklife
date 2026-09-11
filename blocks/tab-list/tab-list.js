import { toClassName } from '../../scripts/aem.js';

let tabsIdx = 0;
export function changeTabs(e) {
  const targetTab = e.currentTarget;
  const targetTabPanelIds = (targetTab.getAttribute('aria-controls') || '')
    .split(' ')
    .filter(Boolean);
  if (!targetTabPanelIds.length) return;
  const [tabGroupPrefix] = targetTabPanelIds[0].split('-panel-');
  const tabList = targetTab.closest('[role="tablist"]');
  if (!tabList) return;
  const mobileAccordion = !window.matchMedia('(min-width: 900px)').matches;
  const isSelected = targetTab.getAttribute('aria-selected') === 'true';
  if (mobileAccordion && isSelected) {
    // Accordion: toggle off
    targetTab.setAttribute('aria-selected', 'false');
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
    .forEach((t) => t.setAttribute('aria-selected', false));
  // Set this tab as selected
  targetTab.setAttribute('aria-selected', true);
  // Hide all tab panels
  document
    .querySelectorAll(`[role="tabpanel"][id^="${tabGroupPrefix}-panel-"]`)
    .forEach((p) => {
      p.setAttribute('hidden', true);
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
  
  const tabs = [];
  const isMobile = !window.matchMedia('(min-width: 900px)').matches;
  
  tabPanels.forEach(([tabLabel, tabPanel, image], i) => {
    const tabId = `${tabsPrefix}-tab-${toClassName(tabLabel)}`;
    const tabPanelId = `${tabsPrefix}-panel-${toClassName(tabLabel)}`;
    
    // Create the list item
    const li = document.createElement('li');
    
    // Build the tab button
    const tabItem = document.createElement('button');
    tabItem.id = tabId;
    tabItem.role = 'tab';
    tabItem.ariaSelected = i === 0;
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
    
    // Append button to list item
    li.appendChild(tabItem);
    
    // Update the tab panel attributes
    tabPanel.id = tabPanelId;
    tabPanel.setAttribute('aria-labelledby', tabId);
    tabPanel.role = 'tabpanel';
    tabPanel.tabIndex = 0;
    
    // Desktop behavior: first panel shown, others hidden
    if (i === 0) {
      tabPanel.removeAttribute('hidden');
      tabPanel.classList.remove('hidden');
      tabPanel.setAttribute('aria-hidden', 'false');
    } else {
      tabPanel.setAttribute('hidden', '');
      tabPanel.classList.add('hidden');
      tabPanel.setAttribute('aria-hidden', 'true');
    }
    
    if (isMobile) {
      // Mobile: append panel inside li for accordion
      li.appendChild(tabPanel);
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
  // Enable arrow navigation between tabs in the tab list
  let tabFocus = 0;
  tabList.addEventListener('keydown', (e) => {
    // Move right
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
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
    }
  });
  block.replaceChildren(tabList);
}

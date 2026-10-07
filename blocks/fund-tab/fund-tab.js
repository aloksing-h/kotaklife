export default function decorate(block) {
  if (window.location.href.includes('https://author-p')) return;

  if (block.classList.contains('custom-tab')) {
    const rows = [...block.children];
    const tabList = document.createElement('ul');
    // tabList.className = 'tablist-wrap';
    tabList.className = block.classList.contains('custom-tab-v2') ? 'tablist-wrap-v2' : 'tablist-wrap'
    tabList.setAttribute('role', 'tablist');
    tabList.setAttribute('aria-label', 'Tabbed content');

    rows.forEach((row) => {
      const cells = [...row.children];
      const label = cells[0]?.textContent.trim();
      const tabId = cells[1]?.textContent.trim();
      const tabClass = cells[2]?.textContent.trim();

      if (!label || !tabId) return;

      if (!tabList.id) tabList.id = `${tabId}-tablist`;

      const listItem = document.createElement('li');
      listItem.className = 'tablist-btn';
      const button = document.createElement('button');
      const isSelected = tabList.children.length === 0;

      button.id = tabId;
      button.className = tabClass ? tabClass.split(/[\s,]+/).filter(Boolean).join(' ') : '';
      button.type = 'button';
      button.textContent = label;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', String(isSelected));
      button.setAttribute('aria-expanded', String(isSelected));
      button.setAttribute('tabindex', isSelected ? '0' : '-1');
      button.setAttribute('aria-controls', tabId);
      if (isSelected) button.setAttribute('aria-current', 'true');

      listItem.append(button);
      tabList.append(listItem);
    });

    block.replaceChildren(tabList);

    // const tabs = [...tabList.querySelectorAll('[role="tab"]')];
    let tabs = [];
    let tabsV2 = [];

    if (tabList.classList.contains('tablist-wrap')) {
      tabs = [...tabList.querySelectorAll('[role="tab"]')];
    } else {
      tabsV2 = [...tabList.querySelectorAll('[role="tab"]')];
    }
    const contentSections = [...document.querySelectorAll('.fund-tab-content')];
    const contentSectionsV2 = [...document.querySelectorAll('.fund-tab-content-v2')];

    const activateTab = (activeTab, wholeTab) => {
      wholeTab.forEach((tab) => {
        const isSelected = tab === activeTab;
        tab.setAttribute('aria-selected', String(isSelected));
        tab.setAttribute('aria-expanded', String(isSelected));
        tab.setAttribute('tabindex', isSelected ? '0' : '-1');
        if (isSelected) {
          tab.setAttribute('aria-current', 'true');
        } else {
          tab.removeAttribute('aria-current');
        }
      });

      // contentSections.forEach((section) => {
      //   section.hidden = section.id !== activeTab.id;
      // });

      if (tabList.classList.contains('tablist-wrap')) {
        contentSections.forEach((section) => {
          section.hidden = section.id !== activeTab.id;
          // check if outer section exist any inner tab also then hide that with outer section
          const innerTabPart = section.querySelector('.custom-tab')
          if (innerTabPart) {
            if (!section.hasAttribute('hidden')) {
              let selectedId;
              innerTabPart.querySelectorAll('.fund-tab-v2').forEach((innerTab) => {
                if (innerTab.getAttribute('aria-selected') === 'true') {
                  selectedId = innerTab.id;
                }
              });
              contentSectionsV2.forEach((innerTabSection) => {
                if (selectedId == innerTabSection.id) {
                  innerTabSection.hidden = false;
                } else {
                  innerTabSection.hidden = true;
                }
              });
            } else {
              contentSectionsV2.forEach((innerTabSection) => innerTabSection.hidden = true);
            }
          }
        });
      } else {
        contentSectionsV2.forEach((section) => {
          section.hidden = section.id !== activeTab.id;
        });
      }
    };

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => activateTab(tab, tabs));
    });

    tabsV2.forEach((v2Tab) => {
      v2Tab.addEventListener('click', () => activateTab(v2Tab, tabsV2));
    });

    if (tabs[0]) activateTab(tabs[0], tabs);
    if (tabsV2[0]) activateTab(tabsV2[0], tabsV2);
  }
}

export default function decorate(block) {
  if (window.location.href.includes('https://author-p')) return;

  const rows = [...block.children];
  const tabList = document.createElement('ul');
  tabList.className = 'tablist-wrap';
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

  const tabs = [...tabList.querySelectorAll('[role="tab"]')];
  const contentSections = [...document.querySelectorAll('.fund-tab-content')];

  const activateTab = (activeTab) => {
    tabs.forEach((tab) => {
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

    contentSections.forEach((section) => {
      section.hidden = section.id !== activeTab.id;
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => activateTab(tab));
  });

  if (tabs[0]) activateTab(tabs[0]);
}

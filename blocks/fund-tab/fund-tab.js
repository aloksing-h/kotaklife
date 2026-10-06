export default function decorate(block) {
	const rows = [...block.children];
	const tabList = document.createElement('ul');
	tabList.setAttribute('role', 'tablist');
	tabList.setAttribute('aria-label', 'Tabbed content');

	rows.forEach((row, index) => {
		const cells = [...row.children];
		const label = cells[0]?.textContent.trim();
		const tabId = cells[1]?.textContent.trim();
		const tabClass = cells[2]?.textContent.trim();

		if (!label || !tabId) return;

		if (index === 0) tabList.id = `${tabId}-tablist`;

		const listItem = document.createElement('li');
		const button = document.createElement('button');
		const isSelected = tabList.children.length === 0;

		button.id = tabId;
		button.className = tabClass || '';
		button.type = 'button';
		button.textContent = label;
		button.setAttribute('role', 'tab');
		button.setAttribute('aria-selected', String(isSelected));
		button.setAttribute('aria-expanded', String(isSelected));
		button.setAttribute('tabindex', isSelected ? '0' : '-1');
		button.setAttribute('aria-controls', `${tabId}-panel`);
		if (isSelected) button.setAttribute('aria-current', 'true');

		listItem.append(button);
		tabList.append(listItem);
	});

	block.replaceChildren(tabList);
}
// eslint-disable-next-line import/no-unresolved
import { toClassName } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

function isFragmentPath(path) {
  return !!path && path.startsWith('/') && !path.startsWith('//');
}

function hasOnlyFragmentLinkContent(element, link) {
  if (!element || !link) return false;
  const allLinks = [...element.querySelectorAll('a')];
  if (allLinks.length !== 1) return false;

  const [onlyLink] = allLinks;
  const linkText = onlyLink.textContent.trim();
  const elementText = element.textContent.trim();

  return elementText === linkText && onlyLink.getAttribute('href') === link.getAttribute('href');
}

async function decorateFragmentLinks(panel) {
  const links = [...panel.querySelectorAll('a[href]')].filter((link) => isFragmentPath(link.getAttribute('href')));

  await Promise.all(links.map(async (link) => {
    const fragment = await loadFragment(link.getAttribute('href'));
    if (!fragment) return;

    const fragmentContainer = document.createElement('div');
    fragmentContainer.className = 'tabs-fragment-container';

    while (fragment.firstChild) {
      fragmentContainer.appendChild(fragment.firstChild);
    }

    const replacementTarget = link.closest('p,div,li,td,th') || link;
    if (replacementTarget !== link && hasOnlyFragmentLinkContent(replacementTarget, link)) {
      replacementTarget.replaceWith(fragmentContainer);
      return;
    }

    link.replaceWith(fragmentContainer);
  }));
}

export default async function decorate(block) {
  // build tablist
  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');

  // decorate tabs and tabpanels
  const tabs = [...block.children].map((child) => child.firstElementChild);
  await Promise.all(tabs.map(async (tab, i) => {
    const id = toClassName(tab.textContent);

    // decorate tabpanel
    const tabpanel = block.children[i];
    tabpanel.className = 'tabs-panel';
    tabpanel.id = `tabpanel-${id}`;
    tabpanel.setAttribute('aria-hidden', !!i);
    tabpanel.setAttribute('aria-labelledby', `tab-${id}`);
    tabpanel.setAttribute('role', 'tabpanel');

    // build tab button
    const button = document.createElement('button');
    button.className = 'tabs-tab';
    button.id = `tab-${id}`;
    button.innerHTML = tab.innerHTML;
    button.setAttribute('aria-controls', `tabpanel-${id}`);
    button.setAttribute('aria-selected', !i);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');
    button.addEventListener('click', () => {
      block.querySelectorAll('[role=tabpanel]').forEach((panel) => {
        panel.setAttribute('aria-hidden', true);
      });
      tablist.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', false);
      });
      tabpanel.setAttribute('aria-hidden', false);
      button.setAttribute('aria-selected', true);
    });
    tablist.append(button);
    tab.remove();
    await decorateFragmentLinks(tabpanel);
  }));

  block.prepend(tablist);
}

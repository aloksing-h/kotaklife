const VISIBLE_ITEMS = 6;

function decorateBookmarksLinks(block) {
  const list = block.querySelector('ul');
  if (!list) return;

  const items = [...list.querySelectorAll(':scope > li')];
  if (items.length <= VISIBLE_ITEMS) return;

  block.classList.remove('is-expanded');

  const showMore = document.createElement('button');
  showMore.className = 'bookmarks-show-more';
  showMore.type = 'button';
  showMore.setAttribute('aria-expanded', 'false');
  showMore.textContent = 'SHOW MORE +';

  showMore.addEventListener('click', () => {
    const isExpanded = block.classList.toggle('is-expanded');
    showMore.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    showMore.textContent = isExpanded ? 'SHOW LESS -' : 'SHOW MORE +';
  });

  list.after(showMore);
}

function decorateHeroBanner(block) {
  // group the icon + trailing text into a single pill badge
  const metaIcon = block.querySelector(':scope > div > div > p > .icon');
  if (metaIcon) {
    const p = metaIcon.closest('p');
    const badge = document.createElement('span');
    badge.className = 'hero-badge';
    while (metaIcon.nextSibling) badge.append(metaIcon.nextSibling);
    badge.prepend(metaIcon);
    p.append(badge);
  }

  const dropdowns = [...block.querySelectorAll(':scope > div > div > ul > li')]
    .filter((li) => li.querySelector(':scope > ul'));
  if (!dropdowns.length) return;

  const closeAll = (except) => {
    dropdowns.forEach((li) => {
      if (li === except) return;
      li.classList.remove('is-open');
      li.querySelector(':scope > p')?.setAttribute('aria-expanded', 'false');
    });
  };

  dropdowns.forEach((li) => {
    const panel = li.querySelector(':scope > ul');
    const trigger = li.querySelector(':scope > p');
    li.classList.add('hero-dropdown');
    trigger.classList.add('hero-dropdown-trigger');
    panel.classList.add('hero-dropdown-panel');
    trigger.setAttribute('role', 'button');
    trigger.setAttribute('tabindex', '0');
    trigger.setAttribute('aria-expanded', 'false');

    const toggle = () => {
      const isOpen = !li.classList.contains('is-open');
      closeAll(li);
      li.classList.toggle('is-open', isOpen);
      trigger.setAttribute('aria-expanded', String(isOpen));
    };

    trigger.addEventListener('click', toggle);
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'Escape') {
        closeAll();
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (!block.contains(e.target)) closeAll();
  });
}

export default function decorate(block) {
  if (block.classList.contains('bookmarks-links')) {
    decorateBookmarksLinks(block);
  }
  if (block.classList.contains('hero-banner')) {
    decorateHeroBanner(block);
  }
}

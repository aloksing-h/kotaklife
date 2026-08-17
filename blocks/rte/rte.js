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

export default function decorate(block) {
  if (block.classList.contains('bookmarks-links')) {
    decorateBookmarksLinks(block);
  }
}

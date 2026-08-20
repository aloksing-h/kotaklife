function decorateBookmarksLinks(block) {
  const VISIBLE_ITEMS = 6;

  const list = block.querySelector('ul');
  if (!list) return;

  const items = [...list.querySelectorAll('li')];

  // Safely find the authored "show more" text
  const showMoreEl = [...block.querySelectorAll('*')].find((el) => el.children.length === 0 && el.textContent.trim().toLowerCase() === 'show more');

  // Hide items beyond the visible limit initially
  items.forEach((item, index) => {
    if (index >= VISIBLE_ITEMS) {
      item.style.display = 'none';
    }
  });

  // Prepare the button
  const button = document.createElement('button');
  button.className = 'bookmarks-show-more';
  button.type = 'button';
  button.setAttribute('aria-expanded', 'false');
  button.textContent = 'SHOW MORE +';

  let buttonAdded = false;

  // --- YOUR CONDITIONALS START HERE ---

  if (showMoreEl && items.length > VISIBLE_ITEMS) {
    // Condition 1: Text is present AND items > 6 (Convert it to button)
    showMoreEl.replaceWith(button);
    buttonAdded = true;
  } else if (!showMoreEl && items.length > VISIBLE_ITEMS) {
    // Condition 2: Text is NOT present AND items > 6 (Create button from JS)
    list.after(button);
    buttonAdded = true;
  } else if (showMoreEl && items.length <= VISIBLE_ITEMS) {
    // Cleanup: Text is present, but items are 6 or fewer (Remove text, no button)
    showMoreEl.remove();
  }

  // --- YOUR CONDITIONALS END HERE ---

  // Only attach the click listener if the button was actually added to the page
  if (buttonAdded) {
    block.classList.remove('is-expanded');

    button.addEventListener('click', () => {
      const isExpanded = block.classList.toggle('is-expanded');
      button.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
      button.textContent = isExpanded ? 'SHOW LESS -' : 'SHOW MORE +';

      // Toggle visibility of the extra items
      items.forEach((item, index) => {
        if (index >= VISIBLE_ITEMS) {
          item.style.display = isExpanded ? 'list-item' : 'none';
        }
      });
    });
  }
}

export default function decorate(block) {
  if (block.classList.contains('bookmarks-links')) {
    decorateBookmarksLinks(block);
  }
}

export default function decorate(block) {
  const items = [...block.children];

  items.forEach((item) => {
    item.classList.add('timeline-item');

    const title = item.children[0];
    if (title) {
      title.classList.add('timeline-item__title');
    }

    const cardsContainer = item.children[1];
    if (!cardsContainer) return;

    cardsContainer.classList.add('timeline-item__cards');
  });

  // Process timeline cards
  const cards = block.querySelectorAll('.timeline-card');
  cards.forEach((card, index) => {
    const image = card.querySelector('picture');
    if (image) {
      image.parentElement.classList.add('timeline-card__image');
    }

    const text = card.querySelector('p:not(:has(picture))');
    if (text) {
      text.classList.add('timeline-card__text');
    }

    card.dataset.index = index;
  });
}

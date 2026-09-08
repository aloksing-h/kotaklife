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

    const children = [...cardsContainer.children];
    const cards = [];
    let currentCard = [];

    children.forEach((child) => {
      if (child.tagName === 'HR') {
        if (currentCard.length > 0) {
          cards.push(currentCard);
          currentCard = [];
        }
      } else {
        currentCard.push(child);
      }
    });

    if (currentCard.length > 0) {
      cards.push(currentCard);
    }

    cardsContainer.innerHTML = '';
    cards.forEach((cardElements, index) => {
      const cardDiv = document.createElement('div');
      cardDiv.className = 'timeline-card';

      cardElements.forEach((el) => {
        if (el.querySelector('picture')) {
          el.classList.add('timeline-card__image');
        } else {
          el.classList.add('timeline-card__text');
        }
        cardDiv.appendChild(el);
      });

      cardDiv.dataset.index = index;
      cardsContainer.appendChild(cardDiv);
    });
  });
}

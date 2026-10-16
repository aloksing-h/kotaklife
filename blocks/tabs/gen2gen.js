/**
 * Gen2Gen Tab Variant Decorator
 * Transforms the tab panel content into a 2-column layout with character illustration,
 * description copy, and 3 benefit mini-cards.
 */

function createDecorativeCurve() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'gen2gen-curve');
  svg.setAttribute('viewBox', '0 0 380 440');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute(
    'd',
    'M 110 0 C 110 120 100 250 45 275 C -10 298 25 330 80 320 C 145 308 175 220 170 170 C 160 85 85 95 0 160',
  );
  path.setAttribute('stroke', '#AFC4DD');
  path.setAttribute('stroke-width', '1.5');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('opacity', '0.7');

  svg.appendChild(path);
  return svg;
}

export default function decorateGen2Gen(block) {
  const panels = block.querySelectorAll('.tabs-panel');

  panels.forEach((panel) => {
    // Avoid double decoration
    if (panel.querySelector('.gen2gen-card')) return;

    const card = document.createElement('div');
    card.className = 'gen2gen-card';

    // Decorative curve line behind character
    card.appendChild(createDecorativeCurve());

    // Left Column: Character Media Illustration
    const mediaCol = document.createElement('div');
    mediaCol.className = 'gen2gen-media';

    // Right Column: Content (Text & Benefit Cards)
    const contentCol = document.createElement('div');
    contentCol.className = 'gen2gen-content';

    const textWrapper = document.createElement('div');
    textWrapper.className = 'gen2gen-text';

    // Find character picture / image
    const picture = panel.querySelector('picture');
    if (picture) {
      const parentP = picture.closest('p');
      mediaCol.appendChild(picture);
      if (parentP && !parentP.textContent.trim()) {
        parentP.remove();
      }
    }

    // Process benefit mini-cards list (ul)
    const ul = panel.querySelector('ul');
    if (ul) {
      ul.classList.add('gen2gen-benefits-list');
      const lis = ul.querySelectorAll('li');
      lis.forEach((li) => {
        li.classList.add('gen2gen-benefit-item');

        // Identify icon or image in li
        const icon = li.querySelector('.icon, img, picture');
        if (icon) {
          icon.classList.add('gen2gen-benefit-icon');
        }

        // Wrap remaining text inside p if not already wrapped
        const hasP = li.querySelector('p');
        if (!hasP) {
          const nodes = [...li.childNodes].filter((node) => node !== icon);
          const p = document.createElement('p');
          nodes.forEach((n) => p.appendChild(n));
          li.appendChild(p);
        }
      });
    }

    // Move remaining children (paragraphs) into textWrapper
    const remainingChildren = [...panel.children].filter(
      (child) => child !== mediaCol && child !== ul && !child.classList?.contains('gen2gen-card'),
    );

    remainingChildren.forEach((child) => {
      textWrapper.appendChild(child);
    });

    contentCol.appendChild(textWrapper);
    if (ul) {
      contentCol.appendChild(ul);
    }

    card.appendChild(mediaCol);
    card.appendChild(contentCol);
    panel.innerHTML = '';
    panel.appendChild(card);
  });
}

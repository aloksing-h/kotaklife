// import { createOptimizedPicture } from '../../scripts/aem.js';
// import { moveInstrumentation } from '../../scripts/scripts.js';

// export default function decorate(block) {
//   /* change to ul, li */
//   const ul = document.createElement('ul');
//   [...block.children].forEach((row) => {
//     const li = document.createElement('li');
//     moveInstrumentation(row, li);
//     while (row.firstElementChild) li.append(row.firstElementChild);
//     [...li.children].forEach((div) => {
//       if (div.children.length === 1 && div.querySelector('picture'))
// div.className = 'cards-card-image';
//       else div.className = 'cards-card-body';
//     });
//     ul.append(li);
//   });
//   ul.querySelectorAll('picture > img').forEach((img) => {
//     const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
//     moveInstrumentation(img, optimizedPic.querySelector('img'));
//     img.closest('picture').replaceWith(optimizedPic);
//   });
//   block.replaceChildren(ul);
// }

import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the standard AEM EDS Cards block
 * @param {Element} block The cards block element
 */
export default function decorate(block) {
  /* Transform row structure to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);

    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-card-image';

        // Unwrap <p> wrappers created by wrapTextNodes in aem.js
        const pWrapper = div.querySelector('p');
        const picture = div.querySelector('picture');
        if (pWrapper && picture) {
          pWrapper.replaceWith(picture);
        }
      } else {
        div.className = 'cards-card-body';
      }
    });
    ul.append(li);
  });

  // Optimize pictures using AEM helper
  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt || '', false, [{ width: '750' }]),
    );
  });

  block.textContent = '';
  block.append(ul);

  // Section specific enhancements for .growing-insurance-company
  const section = block.closest('.growing-insurance-company');
  if (section) {
    // 1. Inject quote symbol into MD card
    const firstCardBody = block.querySelector('li:first-child .cards-card-body');
    if (firstCardBody && !firstCardBody.querySelector('.quote-mark')) {
      const quoteSpan = document.createElement('span');
      quoteSpan.className = 'quote-mark';
      quoteSpan.innerHTML = '“';
      firstCardBody.prepend(quoteSpan);
    }

    // 2. Format CTA link with arrow button
    const ctaLink = section.querySelector('.default-content-wrapper a');
    if (ctaLink && !ctaLink.querySelector('.btn-arrow')) {
      ctaLink.classList.add('know-more-btn');
      const arrow = document.createElement('span');
      arrow.className = 'btn-arrow';
      arrow.innerHTML = '→';
      ctaLink.append(arrow);
    }
  }
}

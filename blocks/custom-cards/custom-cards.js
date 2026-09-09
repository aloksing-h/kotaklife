import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);

    [...li.children].forEach((div, i) => {
      if (i === 0) {
        div.className = 'custom-cards-card-image';

        // Extract variations authored via col1_classes and apply to li
        [...div.classList].forEach((cls) => {
          if (['featured', 'horizontal', 'image-overlay'].includes(cls)) {
            li.classList.add(cls);
          }
        });

        // Process and optimize primary and secondary pictures
        const pictures = [...div.querySelectorAll('picture')];
        pictures.forEach((pic, index) => {
          const img = pic.querySelector('img');
          if (img) {
            const optimizedPic = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '750' }]);
            optimizedPic.classList.add(index === 0 ? 'primary-image' : 'secondary-image');
            pic.replaceWith(optimizedPic);
          }
        });
      } else {
        div.className = 'custom-cards-card-body';
      }
    });
    ul.append(li);
  });

  block.textContent = '';
  block.append(ul);
}

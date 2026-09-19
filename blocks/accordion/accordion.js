export default function decorate(block) {
  // Detect if viewport is desktop (900px and above)
  const isDesktop = window.matchMedia('(min-width: 900px)').matches;

  let index = 1;
  [...block.children].forEach((row) => {
    const label = row.children[0];
    const body = row.children[1];
    if (!label) return;

    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';

    const number = document.createElement('span');
    number.className = 'accordion-item-number';
    number.textContent = index;
    summary.append(number);
    summary.append(...label.childNodes);
    label.remove();

    if (body) {
      // --- NEW WRAPPER FOR CSS GRID ANIMATION ---
      const wrapper = document.createElement('div');
      wrapper.className = 'accordion-item-body-content';
      wrapper.append(...body.childNodes);
      body.append(wrapper);
      // ------------------------------------------
      body.className = 'accordion-item-body';
    }

    const details = document.createElement('details');
    details.className = 'accordion-item';

    if (body) {
      details.append(summary, body);
    } else {
      details.append(summary);
    }

    // Check if accordion body is empty and add 'hide' class if needed
    if (body) {
      const bodyContent = body.querySelector('.accordion-item-body-content');

      // Hide if: body has no children
      if (body.children.length === 0) {
        details.classList.add('hide');
      } else if (bodyContent && bodyContent.children.length === 0) {
        details.classList.add('hide');
      }
    }

    // Check if first ul has nested ul and add 'nested' class if needed
    if (body) {
      const bodyContent = body.querySelector('.accordion-item-body-content');
      if (bodyContent) {
        const firstUl = bodyContent.querySelector(':scope > ul');
        if (firstUl) {
          // Check if first ul has any nested ul inside it
          const hasNestedUl = firstUl.querySelector('ul');
          if (hasNestedUl) {
            firstUl.classList.add('nested');
          }
        }
      }
    }

    // Mobile: add click handler for nested list items to manage active state (one at a time)
    if (!isDesktop && body) {
      const bodyContent = body.querySelector('.accordion-item-body-content');
      if (bodyContent) {
        const nestedUls = bodyContent.querySelectorAll('ul.nested');
        nestedUls.forEach((nestedUl) => {
          const listItems = nestedUl.querySelectorAll(':scope > li');
          listItems.forEach((li) => {
            li.addEventListener('click', (e) => {
              e.stopPropagation(); // Prevent event bubbling

              // If already active, remove active class (close it)
              if (li.classList.contains('active')) {
                li.classList.remove('active');
              } else {
                // If not active, remove active from all siblings and add to clicked one
                listItems.forEach((item) => {
                  item.classList.remove('active');
                });
                // Add active class to clicked li
                li.classList.add('active');
              }
            });
          });
        });
      }
    }

    // Custom click listener for smooth closing and exclusive opening
    summary.addEventListener('click', (e) => {
      e.preventDefault();

      // Desktop behavior: prevent closing, all accordions stay open
      // BUT allow closing if section has mob-accordion class (mobile behavior on desktop)
      const section = block.closest('.section');
      const hasMobAccordionClass = section && section.classList.contains('mob-accordion');

      if (isDesktop && hasMobAccordionClass && details.hasAttribute('open')) {
        return; // Prevent closing on desktop (unless section has mob-accordion class)
      }

      // Allow closing and one-at-a-time opening
      if (details.hasAttribute('open')) {
        // If already open, close it
        details.classList.add('closing');
        // setTimeout(() => {
        details.removeAttribute('open');
        details.classList.remove('closing');
        // }, 300);
      } else {
        // If closed, close all OTHER accordion items first, then open this one
        const allDetails = block.querySelectorAll('.accordion-item[open]');
        allDetails.forEach((openItem) => {
          if (openItem !== details) {
            openItem.classList.add('closing');
            // setTimeout(() => {
            openItem.removeAttribute('open');
            openItem.classList.remove('closing');
            // }, 300);
          }
        });

        // Open the current item
        details.setAttribute('open', '');

        // Reset active class from nested list items when accordion opens
        const bodyContent = details.querySelector('.accordion-item-body-content');
        if (bodyContent) {
          const nestedUls = bodyContent.querySelectorAll('ul.nested');
          nestedUls.forEach((nestedUl) => {
            const listItems = nestedUl.querySelectorAll(':scope > li');
            listItems.forEach((li) => {
              li.classList.remove('active');
            });
          });
        }
      }
    });

    row.append(details);
    index += 1;
  });

  // Desktop: open all accordions by default (unless section has mob-accordion class)
  if (isDesktop) {
    const section = block.closest('.section');
    const hasMobAccordionClass = section && section.classList.contains('mob-accordion');

    // Only open all accordions if section does have mob-accordion class
    if (hasMobAccordionClass) {
      const allDetails = block.querySelectorAll('.accordion-item');
      allDetails.forEach((details) => {
        details.setAttribute('open', '');
      });
    }
  }
}

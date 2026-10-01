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
      // Wrapper required for CSS Grid height animation
      const wrapper = document.createElement('div');
      wrapper.className = 'accordion-item-body-content';
      wrapper.append(...body.childNodes);
      body.append(wrapper);
      body.className = 'accordion-item-body';
    }

    const details = document.createElement('details');
    details.className = 'accordion-item';

    if (body) {
      details.append(summary, body);
    } else {
      details.append(summary);
    }

    // Hide if accordion body is completely empty
    if (body) {
      const bodyContent = body.querySelector('.accordion-item-body-content');
      if (body.children.length === 0 || (bodyContent && bodyContent.children.length === 0)) {
        details.classList.add('hide');
      }
    }

    // Check if first ul has nested ul and add 'nested' class
    if (body) {
      const bodyContent = body.querySelector('.accordion-item-body-content');
      if (bodyContent) {
        const firstUl = bodyContent.querySelector(':scope > ul');
        if (firstUl && firstUl.querySelector('ul')) {
          firstUl.classList.add('nested');
        }
      }
    }

    // Mobile: add click handler for nested list items to manage active state
    if (!isDesktop && body) {
      const bodyContent = body.querySelector('.accordion-item-body-content');
      if (bodyContent) {
        const nestedUls = bodyContent.querySelectorAll('ul.nested');
        nestedUls.forEach((nestedUl) => {
          const listItems = nestedUl.querySelectorAll(':scope > li');
          listItems.forEach((li) => {
            li.addEventListener('click', (e) => {
              e.stopPropagation();
              if (li.classList.contains('active')) {
                li.classList.remove('active');
              } else {
                listItems.forEach((item) => item.classList.remove('active'));
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

      const section = block.closest('.section');
      const hasMobAccordionClass = section && section.classList.contains('mob-accordion');

      // Desktop logic adjustment based on section classes
      if (isDesktop && hasMobAccordionClass && details.hasAttribute('open')) {
        return; 
      }

      if (details.hasAttribute('open')) {
        // CLOSE CURRENT: Add closing class to trigger CSS animation, then remove attribute after 300ms
        details.classList.add('closing');
        setTimeout(() => {
          details.removeAttribute('open');
          details.classList.remove('closing');
        }, 300); // Matches the 0.3s transition in CSS
      } else {
        // OPEN CURRENT & CLOSE OTHERS
        const allDetails = block.querySelectorAll('.accordion-item[open]');
        allDetails.forEach((openItem) => {
          if (openItem !== details) {
            openItem.classList.add('closing');
            setTimeout(() => {
              openItem.removeAttribute('open');
              openItem.classList.remove('closing');
            }, 300);
          }
        });

        // Open the clicked item instantly (CSS animation handles the expansion)
        details.setAttribute('open', '');

        // Reset active class from nested list items
        const bodyContent = details.querySelector('.accordion-item-body-content');
        if (bodyContent) {
          const nestedUls = bodyContent.querySelectorAll('ul.nested');
          nestedUls.forEach((nestedUl) => {
            const listItems = nestedUl.querySelectorAll(':scope > li');
            listItems.forEach((li) => li.classList.remove('active'));
          });
        }
      }
    });

    row.append(details);
    index += 1;
  });

  // Desktop: Initial open state logic
  if (isDesktop) {
    const section = block.closest('.section');
    const hasMobAccordionClass = section && section.classList.contains('mob-accordion');

    // NOTE: If you want all accordions to be open by default on standard desktop blocks, 
    // change `if (!hasMobAccordionClass)` depending on your exact business requirements.
    if (hasMobAccordionClass) {
      const allDetails = block.querySelectorAll('.accordion-item');
      allDetails.forEach((details) => {
        details.setAttribute('open', '');
      });
    }
  }
}
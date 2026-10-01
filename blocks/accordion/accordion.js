function closeFaqItem(details) {
  details.classList.remove('is-open');
  const body = details.querySelector('.accordion-item-body');
  if (!body) {
    details.removeAttribute('open');
    return;
  }

  if (details.dataset.closeTimer) {
    clearTimeout(Number(details.dataset.closeTimer));
    delete details.dataset.closeTimer;
  }

  let closed = false;
  const finishClose = () => {
    if (closed) return;
    closed = true;
    if (details.dataset.closeTimer) {
      clearTimeout(Number(details.dataset.closeTimer));
      delete details.dataset.closeTimer;
    }
    body.removeEventListener('transitionend', onTransitionEnd);
    if (!details.classList.contains('is-open')) {
      details.removeAttribute('open');
    }
  };

  const onTransitionEnd = (e) => {
    if (e.target === body && (e.propertyName === 'grid-template-rows' || e.propertyName === 'opacity')) {
      finishClose();
    }
  };

  body.addEventListener('transitionend', onTransitionEnd);

  // Safety fallback matching transition duration
  const timer = setTimeout(finishClose, 300);
  details.dataset.closeTimer = timer;
}

function openFaqItem(details) {
  if (details.dataset.closeTimer) {
    clearTimeout(Number(details.dataset.closeTimer));
    delete details.dataset.closeTimer;
  }

  const body = details.querySelector('.accordion-item-body');
  details.setAttribute('open', '');
  if (body) {
    // Force layout reflow so browser registers the 0fr start before animating
    // eslint-disable-next-line no-unused-expressions
    body.offsetHeight;
  }
  requestAnimationFrame(() => {
    details.classList.add('is-open');
  });
}

export default function decorate(block) {
  const isDesktop = window.matchMedia('(min-width: 900px)').matches;
  const isFaqV2 = block.classList.contains('faq-v2');

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

    if (isFaqV2) {
      const plusIcon = summary.querySelector('.icon-plus');
      const minusIcon = summary.querySelector('.icon-minus');
      if (plusIcon && minusIcon) {
        const iconWrapper = document.createElement('span');
        iconWrapper.className = 'accordion-item-icon-wrapper';
        plusIcon.before(iconWrapper);
        iconWrapper.append(plusIcon, minusIcon);
      }
    }

    if (body) {
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

    // Check if accordion body is empty and add 'hide' class if needed
    if (body) {
      const bodyContent = body.querySelector('.accordion-item-body-content');
      if (body.children.length === 0 || (bodyContent && bodyContent.children.length === 0)) {
        details.classList.add('hide');
      }
    }

    // Check if first ul has nested ul and add 'nested' class if needed
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

    // FAQ V2 Smooth Exclusive Accordion Controller
    if (isFaqV2) {
      summary.addEventListener('click', (e) => {
        e.preventDefault();

        const isOpen = details.classList.contains('is-open');
        if (isOpen) {
          closeFaqItem(details);
        } else {
          // Exclusive: close all other items in this block
          const allDetails = block.querySelectorAll('.accordion-item');
          allDetails.forEach((other) => {
            if (other !== details && other.classList.contains('is-open')) {
              closeFaqItem(other);
            }
          });
          openFaqItem(details);
        }
      });
    } else {
      // Legacy accordion click handler
      summary.addEventListener('click', (e) => {
        e.preventDefault();

        const section = block.closest('.section');
        const hasMobAccordionClass = section && section.classList.contains('mob-accordion');

        if (isDesktop && hasMobAccordionClass && details.hasAttribute('open')) {
          return;
        }

        if (details.hasAttribute('open')) {
          details.removeAttribute('open');
        } else {
          const allDetails = block.querySelectorAll('.accordion-item[open]');
          allDetails.forEach((openItem) => {
            if (openItem !== details) {
              openItem.removeAttribute('open');
            }
          });
          details.setAttribute('open', '');

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
    }

    row.append(details);
    index += 1;
  });

  // For faq-v2: open first accordion item by default unless explicitly configured otherwise
  if (isFaqV2) {
    const isExplicitlyCollapsed = block.classList.contains('collapsed') || block.classList.contains('all-closed');
    if (!isExplicitlyCollapsed) {
      const firstDetails = block.querySelector('.accordion-item');
      if (firstDetails) {
        firstDetails.setAttribute('open', '');
        firstDetails.classList.add('is-open');
      }
    }
  }

  // Desktop: open all accordions by default (unless section has mob-accordion class)
  if (isDesktop && !isFaqV2) {
    const section = block.closest('.section');
    const hasMobAccordionClass = section && section.classList.contains('mob-accordion');

    if (hasMobAccordionClass) {
      const allDetails = block.querySelectorAll('.accordion-item');
      allDetails.forEach((details) => {
        details.setAttribute('open', '');
      });
    }
  }
}

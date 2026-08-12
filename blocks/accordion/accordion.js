export default function decorate(block) {
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
    
    // Custom click listener for smooth closing
    summary.addEventListener('click', (e) => {
      e.preventDefault(); 
      
      if (details.hasAttribute('open')) {
        details.classList.add('closing');
        setTimeout(() => {
          details.removeAttribute('open');
          details.classList.remove('closing');
        }, 300); 
      } else {
        details.setAttribute('open', '');
      }
    });

    row.append(details);
    index += 1;
  });
}
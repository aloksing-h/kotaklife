export default function decorate(block) {
  const items = [...block.children];

  items.forEach((row, index) => {
    row.classList.add('testimonial-item');
    
    // Accessibility & State Management
    row.setAttribute('tabindex', '0');
    row.setAttribute('role', 'button');
    row.setAttribute('aria-expanded', index === 0 ? 'true' : 'false');

    const columns = [...row.children];
    if (columns.length >= 2) {
      const col1 = columns[0];
      const col2 = columns[1];
      
      col1.classList.add('testimonial-col-1'); 
      col2.classList.add('testimonial-col-2'); 

      // Decorate Column 1: Short Images
      const col1Elements = [...col1.children];
      if (col1Elements.length >= 1) col1Elements[0].classList.add('short-img-mob');
      if (col1Elements.length >= 2) col1Elements[1].classList.add('short-img-desk');

      // Decorate Column 2: Large Images & Video link
      const col2Elements = [...col2.children];
      if (col2Elements.length >= 1) col2Elements[0].classList.add('large-img-mob');
      if (col2Elements.length >= 2) col2Elements[1].classList.add('large-img-desk');
      
      // Play Button Decoration
      if (col2Elements.length >= 3) {
        const videoBtnWrapper = col2Elements[2];
        videoBtnWrapper.classList.add('video-btn-wrapper');
        videoBtnWrapper.setAttribute('aria-label', 'Play video testimonial');
        videoBtnWrapper.setAttribute('role', 'button');
        videoBtnWrapper.setAttribute('tabindex', '0');
      }
    }

    // Single source of truth: Switch aria-expanded state
    const activateItem = () => {
      items.forEach((item) => {
        item.setAttribute('aria-expanded', 'false');
      });
      row.setAttribute('aria-expanded', 'true');
    };

    // Trigger on hover and keyboard focus
    row.addEventListener('mouseenter', activateItem);
    row.addEventListener('focus', activateItem);
  });
}
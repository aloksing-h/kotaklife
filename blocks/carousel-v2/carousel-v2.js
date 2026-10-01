export default function decorate(block) {
  // 1. Create a wrapper for the slides
  const slidesWrapper = document.createElement('div');
  slidesWrapper.className = 'carousel-v2-slides';

  // 2. Setup each slide based on the document rows
  [...block.children].forEach((row) => {
    row.className = 'carousel-v2-slide';
    
    // Wrap the inner content (image and text) so we can style it easily
    const slideContent = document.createElement('div');
    slideContent.className = 'carousel-v2-slide-content';
    slideContent.append(...row.childNodes);
    
    row.append(slideContent);
    slidesWrapper.append(row);
  });

  // 3. Clear the original block and append our new wrapper
  block.textContent = '';
  block.append(slidesWrapper);

  // 4. Create Navigation Buttons (Left and Right arrows)
  const btnContainer = document.createElement('div');
  btnContainer.className = 'carousel-v2-controls';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'carousel-v2-btn prev';
  prevBtn.innerHTML = '&#10094;'; // Unicode Left Chevron
  prevBtn.setAttribute('aria-label', 'Previous slide');

  const nextBtn = document.createElement('button');
  nextBtn.className = 'carousel-v2-btn next';
  nextBtn.innerHTML = '&#10095;'; // Unicode Right Chevron
  nextBtn.setAttribute('aria-label', 'Next slide');

  btnContainer.append(prevBtn, nextBtn);
  block.append(btnContainer);

  // 5. Add Click Logic for the buttons
  prevBtn.addEventListener('click', () => {
    const slideWidth = slidesWrapper.clientWidth;
    slidesWrapper.scrollBy({ left: -slideWidth, behavior: 'smooth' });
  });

  nextBtn.addEventListener('click', () => {
    const slideWidth = slidesWrapper.clientWidth;
    slidesWrapper.scrollBy({ left: slideWidth, behavior: 'smooth' });
  });
}
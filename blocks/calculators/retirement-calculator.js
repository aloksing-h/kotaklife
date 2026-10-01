/**
 * Path: retirement-calculator.js
 */
import { createCurrentAgeField } from './fields/current-age/current-age.js';

// Load CSS dynamically for Edge Delivery Services (EDS) or ES Modules
function loadCSS(href) {
  if (!document.querySelector(`link[href="${href}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
}

export default function retirementCalculator(block) {

  // Find or create target container for age row
  let ageContainer = block.querySelector('.text-field');
  if (!ageContainer) {
    ageContainer = document.createElement('div');
    ageContainer.className = 'age-row';
    block.appendChild(ageContainer);
  }

  // Initialize Current Age Component
  const currentAgeField = createCurrentAgeField({
    value: 30,
    min: 18,
    max: 100,
    onChange: (newAge) => {
      console.log('Updated Current Age:', newAge);
      // Trigger recalculation logic here
    }
  });

  // Append component into DOM
  ageContainer.appendChild(currentAgeField.element);

  // Access value whenever needed:
  // const currentAge = currentAgeField.getValue();
}
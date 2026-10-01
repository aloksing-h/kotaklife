/**
 * Path: fields/life-expectancy/life-expectancy.js
 */
export function createLifeExpectancyField(options = {}) {
  const {
    id = 'lifeExpect',
    label = 'Life expected (age)',
    value = 80,
    min = 60,
    max = 100,
    onChange
  } = options;

  // Create container element
  const container = document.createElement('div');
  container.className = 'life-expectancy-field';

  // Build HTML
  container.innerHTML = `
    <label class="life-expectancy-label" for="${id}">
      ${label}<span class="required-star">*</span>
    </label>
    <input 
      type="number" 
      id="${id}" 
      class="life-expectancy-input" 
      value="${value}" 
      min="${min}" 
      max="${max}" 
      inputmode="numeric" 
      autocomplete="off" 
    />
  `;

  const inputEl = container.querySelector('.life-expectancy-input');

  // Input Event Listeners
  inputEl.addEventListener('focus', () => inputEl.select());

  inputEl.addEventListener('keydown', (e) => {
    const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Home', 'End'];
    if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) {
      if (e.key === 'Enter') inputEl.blur();
      return;
    }
    if (!/^[0-9]$/.test(e.key)) e.preventDefault();
  });

  inputEl.addEventListener('input', () => {
    let val = inputEl.value.replace(/[^0-9]/g, '');
    if (val !== '' && parseInt(val, 10) > max) {
      val = max;
      inputEl.value = max;
    }
    if (typeof onChange === 'function') onChange(val);
  });

  inputEl.addEventListener('blur', () => {
    let num = parseInt(inputEl.value.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num) || num < min) num = min;
    if (num > max) num = max;
    inputEl.value = num;
    if (typeof onChange === 'function') onChange(num);
  });

  return {
    element: container,
    getValue: () => parseInt(inputEl.value, 10) || min,
    setValue: (val) => { inputEl.value = val; }
  };
}
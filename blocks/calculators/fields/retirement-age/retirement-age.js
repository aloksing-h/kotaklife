/**
 * Path: fields/retirement-age/retirement-age.js
 */
export function createRetirementAgeField(options = {}) {
  const {
    id = 'retireAge',
    label = 'Retirement age',
    value = 60,
    min = 40,
    max = 80,
    onChange
  } = options;

  // Create container element
  const container = document.createElement('div');
  container.className = 'retirement-age-field';

  // Build HTML
  container.innerHTML = `
    <label class="retirement-age-label" for="${id}">
      ${label}<span class="required-star">*</span>
    </label>
    <input 
      type="number" 
      id="${id}" 
      class="retirement-age-input" 
      value="${value}" 
      min="${min}" 
      max="${max}" 
      inputmode="numeric" 
      autocomplete="off" 
    />
  `;

  const inputEl = container.querySelector('.retirement-age-input');

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
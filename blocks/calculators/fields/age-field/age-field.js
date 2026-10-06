export default function createAgeField({
  id, label, value, min, max, onChange,
} = {}) {
  const container = document.createElement('div');
  container.className = 'age-field';
  container.innerHTML = `
    <label class="age-label" for="${id}">
      ${label}<span class="required-star">*</span>
    </label>
    <input
      type="number"
      id="${id}"
      class="age-input"
      value="${value}"
      min="${min}"
      max="${max}"
      inputmode="numeric"
      autocomplete="off"
    />
  `;

  const inputEl = container.querySelector('.age-input');
  inputEl.addEventListener('focus', () => inputEl.select());

  inputEl.addEventListener('keydown', (event) => {
    const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Home', 'End'];
    if (allowed.includes(event.key) || event.ctrlKey || event.metaKey) {
      if (event.key === 'Enter') inputEl.blur();
      return;
    }
    if (!/^[0-9]$/.test(event.key)) event.preventDefault();
  });

  inputEl.addEventListener('input', () => {
    let inputValue = inputEl.value.replace(/[^0-9]/g, '');
    if (inputValue !== '' && parseInt(inputValue, 10) > max) {
      inputValue = max;
      inputEl.value = max;
    }
    if (typeof onChange === 'function') onChange(inputValue);
  });

  inputEl.addEventListener('blur', () => {
    let inputValue = parseInt(inputEl.value.replace(/[^0-9]/g, ''), 10);
    if (Number.isNaN(inputValue) || inputValue < min) inputValue = min;
    if (inputValue > max) inputValue = max;
    inputEl.value = inputValue;
    if (typeof onChange === 'function') onChange(inputValue);
  });

  return {
    element: container,
    getValue: () => parseInt(inputEl.value, 10) || min,
    setValue: (nextValue) => { inputEl.value = nextValue; },
  };
}

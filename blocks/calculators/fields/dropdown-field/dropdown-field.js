/**
 * Path: fields/frequency-dropdown/frequency-dropdown.js
 */
export default function createFrequencyDropdownField(options = {}) {
  const {
    id = 'frequencySelect',
    label,
    required = false,
    value = '30',
    optionsList = [
      { label: '30', value: '30' },
      { label: '90', value: '90' },
      { label: '180', value: '180' },
      { label: '365', value: '365' },
    ],
    onChange,
  } = options;

  if (typeof label !== 'string' || !label.trim()) return null;

  let currentValue = value;

  // Create Container
  const container = document.createElement('div');
  container.className = 'frequency-dropdown-field';

  // Build HTML Markup
  container.innerHTML = `
    <label class="frequency-dropdown-label" for="${id}">
      ${label}${required === true ? '<span class="required-star">*</span>' : ''}
    </label>
    <div class="select-wrapper">
      <select id="${id}" class="frequency-dropdown-select">
        ${optionsList
    .map(
      (opt) => `<option value="${opt.value}" ${opt.value === currentValue ? 'selected' : ''}>${opt.label}</option>`,
    )
    .join('')}
      </select>
      <span class="custom-arrow">
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1.5L6 6.5L11 1.5" stroke="#64748B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </div>
  `;

  const selectEl = container.querySelector('.frequency-dropdown-select');

  // Change Event Listener
  selectEl.addEventListener('change', (e) => {
    currentValue = e.target.value;
    if (typeof onChange === 'function') {
      onChange(currentValue);
    }
  });

  return {
    element: container,
    getValue: () => currentValue,
    setValue: (val) => {
      currentValue = val;
      selectEl.value = val;
    },
  };
}

import initDatePicker from '../../../../scripts/date-picker.js';

export default function createInputField(options = {}) {
  const {
    id,
    label,
    type = 'text',
    value = '',
    placeholder = '',
    required = false,
    options: selectOptions = [],
    min,
    max,
    onChange,
  } = options;

  const container = document.createElement('div');
  container.className = `calculator-input-field${type === 'date' ? ' date-field' : ''}`;

  const labelElement = document.createElement('label');
  labelElement.htmlFor = id;
  labelElement.textContent = label;
  if (required) {
    const requiredMark = document.createElement('span');
    requiredMark.className = 'required-star';
    requiredMark.textContent = '*';
    labelElement.append(requiredMark);
  }

  const input = type === 'select' ? document.createElement('select') : document.createElement('input');
  input.id = id;
  input.name = id;
  input.required = required;

  if (type === 'select') {
    selectOptions.forEach(({ label: optionLabel, value: optionValue }) => {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = optionLabel;
      input.append(option);
    });
    input.value = value;
    input.addEventListener('change', () => {
      if (typeof onChange === 'function') onChange(input.value);
    });
  } else {
    input.type = type === 'date' ? 'text' : type;
    input.value = value;
    input.placeholder = placeholder;
    if (min !== undefined) input.min = min;
    if (max !== undefined) input.max = max;
    input.addEventListener('input', () => {
      if (typeof onChange === 'function') onChange(input.value);
    });
    if (type === 'date') initDatePicker(input);
  }

  container.append(labelElement, input);
  return { element: container, input };
}

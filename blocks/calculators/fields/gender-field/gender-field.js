export default function createGenderField(options = {}) {
  const {
    id = 'gender',
    label,
    required = false,
    infoText = '',
    value = '',
    optionsList = [
      { label: 'Male', value: 'male' },
      { label: 'Female', value: 'female' },
      { label: 'Other', value: 'other' },
    ],
    onChange,
  } = options;

  if (typeof label !== 'string' || !label.trim()) return null;

  let currentValue = value;
  const container = document.createElement('div');
  container.className = 'gender-field';

  const fieldset = document.createElement('fieldset');
  fieldset.className = 'gender-options';

  const legend = document.createElement('legend');
  legend.className = 'gender-label';
  legend.append(document.createTextNode(label));

  if (required) {
    const requiredStar = document.createElement('span');
    requiredStar.className = 'required-star';
    requiredStar.setAttribute('aria-hidden', 'true');
    requiredStar.textContent = '*';
    legend.append(requiredStar);
  }

  if (infoText) {
    const infoIcon = document.createElement('img');
    infoIcon.src = '/icons/information-icon.svg';
    infoIcon.alt = '';
    infoIcon.title = infoText;
    legend.append(infoIcon);
  }

  fieldset.append(legend);

  const inputs = optionsList.map((option) => {
    const optionId = `${id}-${option.value}`;
    const optionLabel = document.createElement('label');
    optionLabel.className = 'gender-option';
    optionLabel.htmlFor = optionId;

    const input = document.createElement('input');
    input.type = 'radio';
    input.id = optionId;
    input.name = id;
    input.value = option.value;
    input.checked = option.value === value;
    input.required = required;
    input.addEventListener('change', () => {
      currentValue = input.value;
      if (typeof onChange === 'function') onChange(currentValue);
    });

    const optionText = document.createElement('span');
    optionText.textContent = option.label;
    optionLabel.append(input, optionText);
    fieldset.append(optionLabel);
    return input;
  });

  container.append(fieldset);

  return {
    element: container,
    getValue: () => currentValue,
    setValue: (nextValue) => {
      currentValue = nextValue;
      inputs.forEach((input) => {
        input.checked = input.value === nextValue;
      });
    },
  };
}

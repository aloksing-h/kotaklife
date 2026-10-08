export default function createTobaccoField(options = {}) {
  const {
    id = 'tobaccoUser',
    label = 'Tobacco user',
    required = false,
    infoText = '',
    value = null,
    onChange,
  } = options;

  let currentValue = value;
  const container = document.createElement('div');
  container.className = 'tobacco-field';

  const heading = document.createElement('div');
  heading.className = 'tobacco-heading';

  const labelElement = document.createElement('span');
  labelElement.className = 'tobacco-label';
  labelElement.textContent = label;

  if (required) {
    const requiredStar = document.createElement('span');
    requiredStar.className = 'required-star';
    requiredStar.setAttribute('aria-hidden', 'true');
    requiredStar.textContent = '*';
    labelElement.append(requiredStar);
  }

  if (infoText) {
    const infoIcon = document.createElement('img');
    infoIcon.src = '/icons/information-icon.svg';
    infoIcon.alt = '';
    infoIcon.title = infoText;
    labelElement.append(infoIcon);
  }

  heading.append(labelElement);

  const control = document.createElement('div');
  control.className = 'tobacco-control';

  const noLabel = document.createElement('span');
  noLabel.className = 'tobacco-choice-label';
  noLabel.textContent = 'No';

  const switchLabel = document.createElement('label');
  switchLabel.className = 'tobacco-switch';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = id;
  input.name = id;
  input.setAttribute('role', 'switch');
  input.setAttribute('aria-label', label);
  input.setAttribute('aria-checked', String(value === true));
  if (required) input.setAttribute('aria-required', 'true');
  input.checked = value === true;

  const track = document.createElement('span');
  track.className = 'tobacco-switch-track';
  switchLabel.append(input, track);

  const yesLabel = document.createElement('span');
  yesLabel.className = 'tobacco-choice-label';
  yesLabel.textContent = 'Yes';

  input.addEventListener('change', () => {
    currentValue = input.checked;
    input.setAttribute('aria-checked', String(currentValue));
    if (typeof onChange === 'function') onChange(currentValue);
  });

  control.append(noLabel, switchLabel, yesLabel);
  container.append(heading, control);

  return {
    element: container,
    getValue: () => currentValue,
    setValue: (nextValue) => {
      currentValue = nextValue === null || nextValue === undefined ? null : Boolean(nextValue);
      input.checked = currentValue === true;
      input.setAttribute('aria-checked', String(input.checked));
    },
  };
}

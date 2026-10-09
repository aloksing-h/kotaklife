export default function createRateField(options = {}) {
  const {
    id,
    label,
    required = false,
    infoText = '',
    value = 5,
    suffix = '',
    min = 0,
    max = 15,
    step = 1,
    milestones = [0, 5, 10, 15].map((val) => ({ val, text: `${val}%` })),
    onChange,
  } = options;

  if (typeof label !== 'string' || !label.trim()) return null;

  let currentValue = value;
  const container = document.createElement('div');
  container.className = 'rate-field';
  container.innerHTML = `
    <div class="slider-header-row">
      <span class="slider-label-text">
        ${label}${required === true ? ' <span class="required-star">*</span>' : ''}
        <img src="/icons/information-icon.svg" alt="" title="${infoText}">
      </span>
      <div class="value-display-badge badge-small">
        <input type="text" id="${id}" class="badge-input" value="${currentValue}" inputmode="numeric" autocomplete="off" aria-label="${label}">
        ${suffix ? `<span class="badge-affix">${suffix}</span>` : ''}
      </div>
    </div>

    <div class="wedge-track-wrapper">
      <svg class="wedge-svg" viewBox="0 0 253 30" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M171.699 14.7506C199.978 13.2151 232.296 10.8022 253 7V18.9427H2.61928e-05H0C0 18.786 5.65554e-06 18.771 1.20082e-05 18.8063C8.62522e-06 18.7634 4.58885e-06 18.7122 0 18.6514C63.1132 17.7388 143.642 16.2741 171.699 14.7506Z" fill="#E9EAEB"/>
        <g clip-path="url(#clip0_${id})">
          <path d="M171.699 14.7506C199.978 13.2151 232.296 10.8022 253 7V18.9427H2.61928e-05H0C0 18.786 5.65554e-06 18.771 1.20082e-05 18.8063C8.62522e-06 18.7634 4.58885e-06 18.7122 0 18.6514C63.1132 17.7388 143.642 16.2741 171.699 14.7506Z" fill="#FA1432"/>
        </g>
        <defs>
          <clipPath id="clip0_${id}">
            <rect class="wedge-clip-rect" width="84" height="19" fill="white"/>
          </clipPath>
        </defs>
      </svg>

      <div class="wedge-pill-handle">
        <svg width="17" height="30" viewBox="0 0 17 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="17" height="30" rx="8.5" fill="url(#paint0_linear_${id})"/>
          <path d="M7.19336 12.6875L7.19336 17.3122" stroke="white" stroke-width="0.663992"/>
          <path d="M9.80859 12.6875L9.80859 17.3122" stroke="white" stroke-width="0.663992"/>
          <defs>
            <linearGradient id="paint0_linear_${id}" x1="20.6705" y1="49.4595" x2="30.2206" y2="6.67356" gradientUnits="userSpaceOnUse">
              <stop stop-color="#E1122D"/>
              <stop offset="0.586538" stop-color="#E1122D"/>
              <stop offset="1" stop-color="#7F2224"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>

    <div class="wedge-scale-row">
      ${milestones.map((milestone) => `<span>${milestone.text}</span>`).join('')}
    </div>
  `;

  const inputEl = container.querySelector('.badge-input');
  const trackWrapper = container.querySelector('.wedge-track-wrapper');
  const clipRect = container.querySelector('.wedge-clip-rect');
  const pillHandle = container.querySelector('.wedge-pill-handle');

  function renderTrack() {
    const ratio = Math.max(0, Math.min(1, (currentValue - min) / (max - min)));
    pillHandle.style.left = `${ratio * 100}%`;
    clipRect.setAttribute('width', `${ratio * 253}`);
  }

  function updateValue(num) {
    currentValue = num;
    renderTrack();
    if (typeof onChange === 'function') onChange(currentValue);
  }

  function updatePosFromEvent(event) {
    if (event.cancelable) event.preventDefault();
    const rect = trackWrapper.getBoundingClientRect();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawVal = min + ratio * (max - min);
    const steppedVal = Math.round(rawVal / step) * step;
    inputEl.value = steppedVal;
    updateValue(steppedVal);
  }

  function onStart(event) {
    updatePosFromEvent(event);

    function onMove(moveEvent) {
      updatePosFromEvent(moveEvent);
    }

    function onEnd() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  }

  trackWrapper.addEventListener('mousedown', onStart);
  trackWrapper.addEventListener('touchstart', onStart, { passive: false });
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
    const cleanVal = inputEl.value.replace(/[^0-9]/g, '');
    if (cleanVal === '') return;
    let num = parseInt(cleanVal, 10);
    if (num > max) num = max;
    updateValue(num);
  });

  inputEl.addEventListener('blur', () => {
    const cleanVal = inputEl.value.replace(/[^0-9]/g, '');
    let num = parseInt(cleanVal, 10);
    if (Number.isNaN(num) || num < min) num = min;
    if (num > max) num = max;
    inputEl.value = num;
    updateValue(num);
  });

  renderTrack();

  return {
    element: container,
    getValue: () => currentValue,
    setValue: (val) => {
      currentValue = val;
      inputEl.value = val;
      renderTrack();
    },
  };
}

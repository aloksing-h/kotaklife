export default function createRetirementExpenseRatioField(options = {}) {
  const {
    id = 'expPercentInput',
    label,
    required = false,
    value = 75,
    min = 0,
    max = 100,
    step = 1,
    milestones = [
      { val: 0, text: '0%' },
      { val: 100, text: '100%' },
    ],
    onChange,
  } = options;

  if (typeof label !== 'string' || !label.trim()) return null;

  let currentValue = value;

  // Create Container
  const container = document.createElement('div');
  container.className = 'retirement-expense-ratio-box';

  // Build HTML Markup using exact SVG structure
  container.innerHTML = `
    <div class="slider-header-row">
      <span class="slider-label-text">
        ${label}${required === true ? ' <span class="required-star">*</span>' : ''}
        <img src="/icons/information-icon.svg" alt="" title="Anticipated annual return on investment">
      </span>
      <div class="value-display-badge badge-small">
        <input type="text" id="${id}" class="badge-input" value="${currentValue}" inputmode="numeric" autocomplete="off" aria-label="${label}">
        <span class="badge-affix">%</span>
      </div>
    </div>

    <div class="wedge-track-wrapper">
      <svg class="wedge-svg" viewBox="0 0 585 30" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Inactive Background Track -->
        <path d="M0 17L585 10V20H0V17Z" fill="#E9EAEB"/>
        
        <!-- Active Red Track Clipped to Thumb Position -->
        <g clip-path="url(#clip0_${id})">
          <path d="M0 17L605 10V20H0V17Z" fill="#FA1432"/>
        </g>

        <defs>
          <clipPath id="clip0_${id}">
            <rect class="wedge-clip-rect" width="438.75" height="10" fill="white" transform="translate(0 10)"/>
          </clipPath>
        </defs>
      </svg>

      <!-- Pill Thumb Handle -->
      <div class="wedge-pill-handle">
        <svg width="17" height="30" viewBox="0 0 17 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="17" height="30" rx="8.5" fill="url(#paint0_linear_${id})"/>
          <path d="M7.19336 12.6875L7.19336 17.3122" stroke="white" stroke-width="0.663992"/>
          <path d="M9.809 12.6875L9.809 17.3122" stroke="white" stroke-width="0.663992"/>
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
      ${milestones.map((m) => `<span>${m.text}</span>`).join('')}
    </div>
  `;

  const inputEl = container.querySelector('.badge-input');
  const trackWrapper = container.querySelector('.wedge-track-wrapper');
  const clipRect = container.querySelector('.wedge-clip-rect');
  const pillHandle = container.querySelector('.wedge-pill-handle');

  function renderTrack() {
    const ratio = Math.max(0, Math.min(1, (currentValue - min) / (max - min)));
    const pct = ratio * 100;

    // Position pill handle and scale clip rectangle width along the 585px viewBox
    pillHandle.style.left = `${pct}%`;
    clipRect.setAttribute('width', `${ratio * 585}`);
  }

  function updateValue(num) {
    currentValue = num;
    renderTrack();
    if (typeof onChange === 'function') {
      onChange(currentValue);
    }
  }

  // Mouse & Touch Drag Event Handling
  function updatePosFromEvent(e) {
    if (e.cancelable) e.preventDefault();
    const rect = trackWrapper.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawVal = min + ratio * (max - min);
    const steppedVal = Math.round(rawVal / step) * step;

    inputEl.value = steppedVal;
    updateValue(steppedVal);
  }

  function onStart(e) {
    updatePosFromEvent(e);

    function onMove(evt) {
      updatePosFromEvent(evt);
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

  // Input Box Sanitization
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

  // Initial render
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

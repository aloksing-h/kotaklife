/**
 * Path: fields/expected-inflation/expected-inflation.js
 */
export function createExpectedInflationField(options = {}) {
  const {
    id = 'inflationInput',
    label = 'Expected inflation rate',
    value = 5,
    min = 0,
    max = 15,
    step = 1,
    milestones = [
      { val: 0, text: '0%' },
      { val: 5, text: '5%' },
      { val: 10, text: '10%' },
      { val: 15, text: '15%' }
    ],
    onChange
  } = options;

  let currentValue = value;

  // Create Container
  const container = document.createElement('div');
  container.className = 'expected-inflation-box';

  // Build HTML via DOM methods without external helpers
  container.innerHTML = `
    <div class="slider-header-row">
      <span class="slider-label-text">
        ${label}
        <img src="/icons/information-icon.svg" alt="info-icon">
      </span>
      <div class="value-display-badge badge-small">
        <input type="text" id="${id}" class="badge-input" value="${currentValue}" inputmode="numeric" autocomplete="off" aria-label="${label}">
        <span class="badge-affix">%</span>
      </div>
    </div>

    <div class="wedge-track-wrapper">
      <svg class="wedge-svg" viewBox="0 0 253 30" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Inactive Background Wedge Track -->
        <path d="M171.699 14.7506C199.978 13.2151 232.296 10.8022 253 7V18.9427H2.61928e-05H0C0 18.786 5.65554e-06 18.771 1.20082e-05 18.8063C8.62522e-06 18.7634 4.58885e-06 18.7122 0 18.6514C63.1132 17.7388 143.642 16.2741 171.699 14.7506Z" fill="#E9EAEB"/>
        
        <!-- Active Red Wedge Track Clipped to Thumb Position -->
        <g clip-path="url(#clip0_${id})">
          <path d="M171.699 14.7506C199.978 13.2151 232.296 10.8022 253 7V18.9427H2.61928e-05H0C0 18.786 5.65554e-06 18.771 1.20082e-05 18.8063C8.62522e-06 18.7634 4.58885e-06 18.7122 0 18.6514C63.1132 17.7388 143.642 16.2741 171.699 14.7506Z" fill="#FA1432"/>
        </g>
        
        <defs>
          <clipPath id="clip0_${id}">
            <rect class="wedge-clip-rect" width="84" height="19" fill="white"/>
          </clipPath>
        </defs>
      </svg>

      <!-- Pill Thumb Handle -->
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
      ${milestones.map(m => `<span>${m.text}</span>`).join('')}
    </div>
  `;

  const inputEl = container.querySelector('.badge-input');
  const trackWrapper = container.querySelector('.wedge-track-wrapper');
  const clipRect = container.querySelector('.wedge-clip-rect');
  const pillHandle = container.querySelector('.wedge-pill-handle');

  function renderTrack() {
    const ratio = Math.max(0, Math.min(1, (currentValue - min) / (max - min)));
    const pct = ratio * 100;
    
    // Update handle position and SVG clip rectangle along the 253px viewBox
    pillHandle.style.left = `${pct}%`;
    clipRect.setAttribute('width', `${ratio * 253}`);
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
    let cleanVal = inputEl.value.replace(/[^0-9]/g, '');
    if (cleanVal === '') return;
    let num = parseInt(cleanVal, 10);
    if (num > max) num = max;
    updateValue(num);
  });

  inputEl.addEventListener('blur', () => {
    let cleanVal = inputEl.value.replace(/[^0-9]/g, '');
    let num = parseInt(cleanVal, 10);
    if (isNaN(num) || num < min) num = min;
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
    }
  };
}
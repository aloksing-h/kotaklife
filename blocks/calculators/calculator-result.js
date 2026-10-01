const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

export default function renderCalculatorResult(variant = 'retirement', content = {}) {
  if (variant !== 'retirement') {
    const defaults = {
      compound: { title: 'You may get' },
      fire: { title: 'Your F.I.R.E number', summary: 'FIRE snapshot' },
      term: { title: 'Your estimated term premium' },
    };
    const settings = defaults[variant];
    if (!settings) return '';
    const title = escapeHtml(content.resultTitle || settings.title);
    const value = escapeHtml(content.resultValue);
    const subtitle = escapeHtml(content.resultSubtitle);
    const image = String(content.resultImage || '');
    const media = /^(https?:\/\/|\/)/.test(image)
      ? `<img class="result-media" src="${escapeHtml(image)}" alt="${escapeHtml(content.resultImageAlt)}" loading="lazy">`
      : '';
    const details = [1, 2, 3, 4].map((index) => {
      const detailLabel = content[`detail${index}Label`];
      const detailValue = content[`detail${index}Value`];
      return detailLabel || detailValue ? `
        <div class="result-detail">
          <span>${escapeHtml(detailLabel)}</span><strong>${escapeHtml(detailValue)}</strong>
        </div>` : '';
    }).join('');
    const estimate = `<div class="result-estimate">
      <p>${title}</p><strong>${value}</strong>${subtitle ? `<small>${subtitle}</small>` : ''}
    </div>`;
    const actionUrl = String(content.actionUrl || '');
    const action = content.actionLabel && /^(https?:\/\/|\/)/.test(actionUrl)
      ? `<a class="cta-plan-btn" href="${escapeHtml(actionUrl)}">${escapeHtml(content.actionLabel)} <span class="btn-circle-arrow">&rarr;</span></a>` : '';
    return `<div class="calculator-result calculator-result-${variant}">
      ${variant === 'term' ? media : ''}
      ${estimate}
      ${variant === 'term' ? '' : media}
      ${variant === 'fire' && details ? `<div class="result-snapshot">
        <p>${escapeHtml(content.summaryTitle || settings.summary)}</p>
        <div class="result-details">${details}</div>
      </div>` : ''}
      ${action}
    </div>`;
  }
  return `
    <div class="fund-estimate-box">
      <p class="fund-estimate-label">Estimated retirement fund</p>
      <div class="fund-estimate-value" id="fundResult">₹ 97,04,512</div>
    </div>

    <div class="illustration-wrap">
      <svg class="couple-svg" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="55" cy="40" r="14" stroke="currentColor" stroke-width="2.2" fill="none"/>
        <path d="M32 98 C32 75, 78 75, 78 98" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="105" cy="42" r="13" stroke="currentColor" stroke-width="2.2" fill="none"/>
        <path d="M84 98 C84 77, 126 77, 126 98" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
      </svg>
    </div>

    <div class="savings-summary-box">
      <div class="toggle-row">
        <span>Monthly</span>
        <label class="switch-label">
          <input type="checkbox" id="freqToggle">
          <span class="switch-knob"></span>
        </label>
        <span>Yearly</span>
      </div>

      <p class="savings-title-text" id="savingsTitle">Required monthly savings</p>
      <div class="savings-amount-text" id="savingsResult">₹ 26,957</div>
    </div>

    <button class="cta-plan-btn" type="button">
      <span>Start Your Planning Now</span>
      <span class="btn-circle-arrow">&rarr;</span>
    </button>
  `;
}

import { moveInstrumentation } from '../../scripts/scripts.js';

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

function readText(row, fallback = '') {
  return row?.textContent.trim() || fallback;
}

function readImage(row) {
  const image = row?.querySelector('img');
  return image ? { src: image.getAttribute('src') || '', alt: image.getAttribute('alt') || '' } : null;
}

function readLink(row) {
  return row?.querySelector('a[href]')?.getAttribute('href') || '';
}

function isSafeUrl(url) {
  return /^(https?:\/\/|\/(?!\/)|\.\.?\/|#)/i.test(url);
}

export default function decorate(block) {
  const rows = [...block.children];
  const [fundTitleRow, illustrationRow, illustrationDescriptionRow, monthlyLabelRow,
    yearlyLabelRow, monthlyTitleRow, yearlyTitleRow, ctaLabelRow, ctaLinkRow] = rows;

  const fundTitle = readText(fundTitleRow, 'Estimated retirement fund');
  const illustration = readImage(illustrationRow);
  const illustrationAlt = readText(illustrationDescriptionRow, illustration?.alt || '');
  const monthlyLabel = readText(monthlyLabelRow, 'Monthly');
  const yearlyLabel = readText(yearlyLabelRow, 'Yearly');
  const monthlyTitle = readText(monthlyTitleRow, 'Required monthly savings');
  const yearlyTitle = readText(yearlyTitleRow, 'Required yearly savings');
  const ctaLabel = readText(ctaLabelRow, 'Start Your Planning Now');
  const ctaLink = readLink(ctaLinkRow);
  const imageMarkup = illustration && isSafeUrl(illustration.src)
    ? `<img class="result-summary-panel-illustration" src="${escapeHtml(illustration.src)}" alt="${escapeHtml(illustrationAlt)}">`
    : '';
  const ctaMarkup = ctaLink && isSafeUrl(ctaLink)
    ? `<a class="result-summary-panel-cta" href="${escapeHtml(ctaLink)}">
        <span class="result-summary-panel-cta-label">${escapeHtml(ctaLabel)}</span>
        <span class="result-summary-panel-cta-arrow" aria-hidden="true">&rarr;</span>
      </a>`
    : '';

  block.innerHTML = `
    <section class="result-summary-panel-content" aria-label="${escapeHtml(fundTitle)}">
      <div class="result-summary-panel-fund">
        <p class="result-summary-panel-fund-title">${escapeHtml(fundTitle)}</p>
        <output class="result-summary-panel-fund-value" id="fundResult" aria-live="polite"></output>
      </div>
      <figure class="result-summary-panel-image">${imageMarkup}</figure>
      <div class="result-summary-panel-savings">
        <div class="result-summary-panel-frequency" role="group" aria-label="Savings frequency">
          <span class="result-summary-panel-frequency-label">${escapeHtml(monthlyLabel)}</span>
          <label class="result-summary-panel-switch">
            <input id="freqToggle" type="checkbox" aria-label="Switch savings frequency">
            <span class="result-summary-panel-switch-track" aria-hidden="true"></span>
          </label>
          <span class="result-summary-panel-frequency-label">${escapeHtml(yearlyLabel)}</span>
        </div>
        <p class="result-summary-panel-savings-title" id="savingsTitle">${escapeHtml(monthlyTitle)}</p>
        <span class="result-summary-panel-yearly-title" hidden>${escapeHtml(yearlyTitle)}</span>
        <output class="result-summary-panel-savings-value" id="savingsResult" aria-live="polite"></output>
      </div>
      ${ctaMarkup}
    </section>
  `;

  const targets = [
    block.querySelector('.result-summary-panel-fund-title'),
    block.querySelector('.result-summary-panel-image'),
    block.querySelector('.result-summary-panel-illustration'),
    block.querySelector('.result-summary-panel-frequency-label'),
    block.querySelectorAll('.result-summary-panel-frequency-label')[1],
    block.querySelector('#savingsTitle'),
    block.querySelector('.result-summary-panel-yearly-title'),
    block.querySelector('.result-summary-panel-cta-label'),
    block.querySelector('.result-summary-panel-cta'),
  ];
  rows.forEach((row, index) => {
    if (row && targets[index]) moveInstrumentation(row, targets[index]);
  });

  const frequencyToggle = block.querySelector('#freqToggle');
  const savingsTitle = block.querySelector('#savingsTitle');
  const yearlySavingsTitle = block.querySelector('.result-summary-panel-yearly-title');
  frequencyToggle.addEventListener('change', () => {
    savingsTitle.textContent = frequencyToggle.checked
      ? yearlySavingsTitle.textContent : monthlyTitle;
  });
}

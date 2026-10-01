import { loadForm } from '../form/form.js';
import retirementCalculator from './retirement-calculator.js';

const legacyFields = [
  'text', 'link', 'linkCompound', 'linkFire', 'linkTerm', 'resultTitle',
  'resultValue', 'resultSubtitle', 'resultImage',
  'savingsMonthlyLabel', 'savingsYearlyLabel', 'summaryTitle',
  'detail1Label', 'detail1Value', 'detail2Label', 'detail2Value',
  'detail3Label', 'detail3Value', 'detail4Label', 'detail4Value',
  'actionLabel', 'actionUrl',
];

export default async function decorate(block) {
  const variant = ['compound', 'fire', 'term'].find((name) => block.classList.contains(name)) || 'retirement';
  const formField = {
    retirement: 'link', compound: 'linkCompound', fire: 'linkFire', term: 'linkTerm',
  }[variant];
  const resultContent = {};
  const formRows = {};
  const rows = [...block.querySelectorAll(':scope > div')];
  const keyed = rows.some((row) => row.children.length > 1);
  rows.forEach((row, index) => {
    const [name, value] = keyed ? row.children : [null, row.children[0]];
    if (!value) return;
    const key = keyed ? name.textContent.trim().replace(/^./, (letter) => letter.toLowerCase())
      .replace(/[\s_-]+([a-z])/gi, (_, letter) => letter.toUpperCase()) : legacyFields[index];
    if (!key) return;
    if (['link', 'linkCompound', 'linkFire', 'linkTerm'].includes(key)) formRows[key] = row;
    if (key.startsWith('result') || key.startsWith('detail') || key.startsWith('savings')
      || key === 'summaryTitle' || key === 'actionLabel' || key === 'actionUrl') {
      const authoredValue = value.querySelector('a[href]')?.getAttribute('href')
        || value.querySelector('img')?.getAttribute('src') || value.textContent.trim();
      if (authoredValue) resultContent[key] = authoredValue;
      if (key === 'resultImage' && value.querySelector('img')?.alt) {
        resultContent.resultImageAlt = value.querySelector('img').alt;
      }
    }
  });

  const hasFormSource = (row) => {
    const href = row?.querySelector('a[href]')?.getAttribute('href');
    return href && href !== '#';
  };
  const formRow = hasFormSource(formRows[formField]) ? formRows[formField] : formRows.link;
  if (hasFormSource(formRow)) {
    rows.forEach((row) => { if (row !== formRow) row.remove(); });
    const form = await loadForm(block);
    if (!form) return;
  }

  retirementCalculator(block, variant, resultContent);
}

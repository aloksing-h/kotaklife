import { loadForm } from '../form/form.js';
import retirementCalculator from './retirement-calculator.js';

export default async function decorate(block) {
  const variant = ['compound', 'fire', 'term'].find((name) => block.classList.contains(name)) || 'retirement';
  const formField = {
    retirement: 'link', compound: 'linkCompound', fire: 'linkFire', term: 'linkTerm',
  }[variant];
  const resultContent = {};
  let legacyFormRow;
  let activeFormRow;
  block.querySelectorAll(':scope > div').forEach((row) => {
    const [name, value] = row.children;
    if (!name || !value) return;
    const key = name.textContent.trim().replace(/^./, (letter) => letter.toLowerCase())
      .replace(/[\s_-]+([a-z])/gi, (_, letter) => letter.toUpperCase());
    if (key === 'link') legacyFormRow = row;
    if (key === formField) activeFormRow = row;
    if (['link', 'linkCompound', 'linkFire', 'linkTerm'].includes(key) && key !== formField) {
      row.remove();
    }
    if (key.startsWith('result') || key.startsWith('detail') || key === 'summaryTitle' || key === 'actionLabel') {
      resultContent[key] = value.querySelector('a, img')?.href || value.querySelector('img')?.src || value.textContent.trim();
      row.remove();
    }
  });
  if (!activeFormRow?.querySelector('a[href]') && legacyFormRow?.querySelector('a[href]')) {
    block.append(legacyFormRow);
  }
  const form = await loadForm(block);
  if (!form) return;

  retirementCalculator(block, variant, resultContent);
}

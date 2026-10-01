import { loadForm } from '../form/form.js';
import retirementCalculator from './retirement-calculator.js';

export default async function decorate(block) {
  const variant = ['compound', 'fire', 'term'].find((name) => block.classList.contains(name)) || 'retirement';
  const resultContent = {};
  block.querySelectorAll(':scope > div').forEach((row) => {
    const [name, value] = row.children;
    if (!name || !value) return;
    const key = name.textContent.trim().replace(/^./, (letter) => letter.toLowerCase())
      .replace(/[\s_-]+([a-z])/gi, (_, letter) => letter.toUpperCase());
    if (key.startsWith('result') || key.startsWith('detail') || key === 'summaryTitle' || key === 'actionLabel') {
      resultContent[key] = value.querySelector('a, img')?.href || value.querySelector('img')?.src || value.textContent.trim();
      row.remove();
    }
  });
  const form = await loadForm(block);
  if (!form) return;

  retirementCalculator(block, variant, resultContent);
}

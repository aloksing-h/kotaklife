import { loadForm } from '../form/form.js';
import compoundCalculator from './compound-calculator.js';
import fireCalculator from './fire-calculator.js';
import retirementCalculator from './retirement-calculator.js';

export default async function decorate(block) {
  const form = await loadForm(block);
  if (!form) return;

  if (block.querySelector('.current-age-field')) {
    retirementCalculator(block);
  }

  if (block.querySelector('.frequency-field')) {
    compoundCalculator(block);
  }
  // fireCalculator(block);
}

import { loadForm } from '../form/form.js';
import retirementCalculator from './retirement-calculator.js';
export default async function decorate(block) {
  const form = await loadForm(block);
  if (!form) return;
  
  retirementCalculator(block);
}

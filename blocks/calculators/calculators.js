import {
  loadForm
} from '../form/form.js';
import compoundCalculator from './compound-calculator.js';
import fireCalculator from './fire-calculator.js';
// import fireCalculator from './fire-calculator.js';
import retirementCalculator from './retirement-calculator.js';

export default async function decorate(block) {
  const form = await loadForm(block);
  if (!form) return;
  const isRetirementText = block?.classList.contains('retirement-text') ?? false;
  const isCompoundText = block?.classList.contains('compound-graph') ?? false;
  const isFireText = block?.classList.contains('fire-text') ?? false;
  const isTemInsuranceText = block?.classList.contains('term-inurance-text') ?? false;
  if (isRetirementText) {
    retirementCalculator(block);
  }

  // if (isCompoundText) {
  //   compoundCalculator(block);
  // }

  if (isFireText) {
    fireCalculator(block);
  }

  if (isTemInsuranceText) {
    termInsuranceCalculator(block);
  }
}
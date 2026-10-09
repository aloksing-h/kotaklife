/**
 * Path: retirement-calculator.js
 */
import createAgeField from './fields/age-field/age-field.js';
import createMonthlyExpenseWaveSlider from './fields/monthly-expense-wave-slider/monthly-expense-wave-slider.js';
import createRetirementExpenseRatioField from './fields/retirement-expense-ratio/retirement-expense-ratio.js';

export function calculateFirePlan({
  currentAge, retireAge, monthlyExpense, inflationrate,
}) {
  const errors = [];
  if (!Number.isInteger(currentAge) || currentAge < 0) errors.push('Current age must be a non-negative whole number.');
  if (!Number.isInteger(retireAge) || retireAge < 0) errors.push('Retirement age must be a non-negative whole number.');
  if (retireAge <= currentAge) errors.push('Retirement age must be greater than current age.');
  if (!Number.isFinite(monthlyExpense) || monthlyExpense <= 0) errors.push('Monthly expense must be greater than zero.');
  if (!Number.isFinite(inflationrate) || inflationrate < 0) errors.push('Inflation rate must be a non-negative percentage.');

  if (errors.length) return { isValid: false, errors };

  const yearsToRetirement = retireAge - currentAge;
  const yearlyExpenseToday = monthlyExpense * 12;
  const exactYearlyExpenseAtRetirement = yearlyExpenseToday
    * ((1 + (inflationrate / 100)) ** yearsToRetirement);
  const yearlyExpenseAtRetirement = Math.round(exactYearlyExpenseAtRetirement);

  return {
    isValid: true,
    errors,
    yearsToRetirement,
    yearlyExpenseToday: Math.round(yearlyExpenseToday),
    yearlyExpenseAtRetirement,
    leanFireTarget: Math.round(exactYearlyExpenseAtRetirement * 15),
    standardFireTarget: Math.round(exactYearlyExpenseAtRetirement * 25),
    fatFireTarget: Math.round(exactYearlyExpenseAtRetirement * 50),
  };
}

export default function fireCalculator(block) {
  const onPlanInputChange = () => {
    block.dispatchEvent(new Event('fire-plan-input-change'));
  };
  const getLabel = (selector) => block.querySelector(`${selector} label`)?.textContent.trim() || '';
  const getConfiguredValues = (selector, fallback) => {
    const input = block.querySelector(`${selector} input`);
    if (!input?.value.trim()) return fallback;
    const values = input.value.split(',').map((value) => Number(value.trim()));
    return values.every(Number.isFinite) ? values : fallback;
  };
  const getRange = (selector, fallback) => {
    const values = getConfiguredValues(selector, fallback);
    return values.length >= 2 && values[0] < values[1] ? values.slice(0, 2) : fallback;
  };

  const currentAgeRange = getRange('.current-age-range-field', [18, 70]);
  const retirementAgeRange = getRange('.retirement-age-range-field', [25, 80]);
  const monthlyExpenseRange = getRange('.monthly-expense-range-field', [5000, 500000]);
  const inflationRange = getRange('.inflation-range-field', [1, 20]);
  const monthlyExpenseMilestones = getConfiguredValues('.monthly-expense-milestone-field', [5000, 100000, 200000, 300000, 400000, 500000]);
  const inflationMilestones = getConfiguredValues('.inflation-milestone-field', inflationRange);
  const clampToRange = (value, range) => Math.max(range[0], Math.min(range[1], value));
  const currentAgeValue = clampToRange(30, currentAgeRange);
  const retirementAgeValue = clampToRange(Math.max(60, currentAgeValue + 1), retirementAgeRange);

  const currentAgeField = createAgeField({
    id: 'currentAge',
    label: getLabel('.current-age-field'),
    value: currentAgeValue,
    min: currentAgeRange[0],
    max: currentAgeRange[1],
    required: true,
    onChange: onPlanInputChange,
  });

  const retireAgeField = createAgeField({
    id: 'retireAge',
    label: getLabel('.retirement-age-field'),
    value: retirementAgeValue,
    min: retirementAgeRange[0],
    max: retirementAgeRange[1],
    required: true,
    onChange: onPlanInputChange,
  });

  const expenseWaveSlider = createMonthlyExpenseWaveSlider({
    title: getLabel('.monthly-expense-field'),
    required: true,
    infoText: 'Your current monthly cost of living',
    editable: true,
    value: clampToRange(40000, monthlyExpenseRange),
    min: monthlyExpenseRange[0],
    max: monthlyExpenseRange[1],
    step: 5000,
    milestones: monthlyExpenseMilestones,
    onChange: onPlanInputChange,
  });

  const inflationRateField = createRetirementExpenseRatioField({
    id: 'expPercentInput',
    label: getLabel('.inflation-rate-field'),
    value: clampToRange(5, inflationRange),
    min: inflationRange[0],
    max: inflationRange[1],
    step: 1,
    milestones: inflationMilestones.map((val) => ({ val, text: `${val}%` })),
    onChange: onPlanInputChange,
  });

  function publishFirePlanInputs() {
    const planInputs = {
      ...(currentAgeField && { currentAge: currentAgeField.getValue() }),
      ...(retireAgeField && { retireAge: retireAgeField.getValue() }),
      ...(expenseWaveSlider && { monthlyExpense: expenseWaveSlider.getValue() }),
      ...(inflationRateField && { inflationrate: inflationRateField.getValue() }),
    };
    const result = calculateFirePlan(planInputs);
    const retirementAgeInput = retireAgeField?.element.querySelector('input');
    const ageOrderInvalid = planInputs.retireAge <= planInputs.currentAge;
    retirementAgeInput?.setCustomValidity(ageOrderInvalid ? 'Retirement age must be greater than current age.' : '');
    retirementAgeInput?.setAttribute('aria-invalid', String(ageOrderInvalid));
    const scope = block.closest('.fire-calculator') || block.closest('.section') || document;

    scope.firePlanInputs = planInputs;
    scope.firePlanResult = result;
    scope.dispatchEvent(new CustomEvent('fire-plan-update', {
      detail: { ...planInputs, result },
      bubbles: true,
    }));
  }

  block.addEventListener('fire-plan-input-change', publishFirePlanInputs);

  const calculatorMarkup = `<div class="calculator-modal">
    <div class="calculator-grid">
      <div class="calc-card">
        <div class="age-inputs-row">
          <div class="field-group" id="currentAgeFieldSlot"></div>
          <div class="field-group" id="retirementagefieldslot"></div>
        </div>
        <div class="slider-box" id="waveslider"></div>
        <div class="slider-box" id="retirement-ration"></div>
      </div>
  </div>`;
  const fields = [
    ['#currentAgeFieldSlot', currentAgeField],
    ['#retirementagefieldslot', retireAgeField],
    ['#waveslider', expenseWaveSlider],
    ['#retirement-ration', inflationRateField],
  ];
  block.innerHTML = fields.some(([, field]) => field) ? calculatorMarkup : '';
  fields.forEach(([selector, field]) => {
    const slot = block.querySelector(selector);
    if (field) slot.appendChild(field.element);
    else slot?.remove();
  });
  const ageInputsRow = block.querySelector('.age-inputs-row');
  if (ageInputsRow && !ageInputsRow.children.length) ageInputsRow.remove();

  publishFirePlanInputs();
}

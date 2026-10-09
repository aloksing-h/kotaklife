/**
 * Path: retirement-calculator.js
 */
import createAgeField from './fields/age-field/age-field.js';
import createMonthlyExpenseWaveSlider from './fields/monthly-expense-wave-slider/monthly-expense-wave-slider.js';
import createRateField from './fields/rate-field/rate-field.js';
import createRetirementExpenseRatioField from './fields/retirement-expense-ratio/retirement-expense-ratio.js';

export default function retirementCalculator(block) {
  function onPlanInputChange() {
    block.dispatchEvent(new Event('retirement-plan-input-change'));
  }
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

  const currentAgerange = getRange('.current-age-range-field', [18, 70]);
  const retireAgeRange = getRange('.desired-retirement-age-range-field', [25, 80]);
  const expectedAgeRange = getRange('.life-expectation-range-field', [60, 100]);
  const monthlyExpenseRange = getRange('.current-monthly-expense-range-field', [5000, 500000]);
  const inflationRange = getRange('.expected-inflation-range-field', [1, 20]);
  const expecteReturnRange = getRange('.expected-return-range-field', [1, 20]);
  const retirementExpenseRange = getRange('.expected-expense-range-field', [1, 100]);

  const monthlyExpenseMilestone = getConfiguredValues('.monthly-expense-milestone-field', monthlyExpenseRange);
  const inlfationMilestone = getConfiguredValues('.expected-inflation-milestone-field', inflationRange);
  const expectedReturnMilestone = getConfiguredValues('.expected-return-millstone-field', expecteReturnRange);
  const expecteExpenseMilestone = getConfiguredValues('.retirement-expense-milestone-field', retirementExpenseRange);

  const currentAgeField = createAgeField({
    id: 'currentAge',
    label: getLabel('.current-age-field'),
    value: 30,
    min: currentAgerange[0],
    max: currentAgerange[1],
    required: true,
    onChange: onPlanInputChange,
  });

  const retirementAgeField = createAgeField({
    id: 'retireAge',
    label: getLabel('.retirement-age-field'),
    value: 60,
    min: retireAgeRange[0],
    max: retireAgeRange[1],
    required: true,
    onChange: onPlanInputChange,
  });

  const lifeExpectancyField = createAgeField({
    id: 'lifeExpect',
    label: getLabel('.life-expected-field'),
    value: 80,
    min: expectedAgeRange[0],
    max: expectedAgeRange[1],
    required: true,
    onChange: onPlanInputChange,
  });

  const expenseWaveSlider = createMonthlyExpenseWaveSlider({
    title: getLabel('.monthly-expense-field'),
    required: true,
    infoText: 'Your current monthly cost of living',
    editable: true,
    value: 40000,
    min: monthlyExpenseRange[0],
    max: monthlyExpenseRange[1],
    step: 5000,
    milestones: monthlyExpenseMilestone,
    onChange: onPlanInputChange,
  });

  const inflationField = createRateField({
    id: 'inflationInput',
    label: getLabel('.inflation-rate-field'),
    value: 5,
    suffix: '%',
    min: inflationRange[0],
    max: inflationRange[1],
    step: 1,
    milestones: inlfationMilestone.map((val) => ({ val, text: `${val}%` })),
    onChange: onPlanInputChange,
  });

  const returnField = createRateField({
    id: 'returnInput',
    label: getLabel('.expected-return-field'),
    infoText: 'Anticipated annual return on investment',
    value: 5,
    suffix: '%',
    min: expecteReturnRange[0],
    max: expecteReturnRange[1],
    step: 1,
    milestones: expectedReturnMilestone.map((val) => ({ val, text: `${val}%` })),
    onChange: onPlanInputChange,
  });

  const retirementExpenseRatio = createRetirementExpenseRatioField({
    id: 'expPercentInput',
    label: getLabel('.expected-expense-field'),
    value: 75,
    min: retirementExpenseRange[0],
    max: retirementExpenseRange[1],
    step: 1,
    milestones: expecteExpenseMilestone.map((val) => ({ val, text: `${val}%` })),
    onChange: onPlanInputChange,
  });

  function publishRetirementPlanInputs() {
    const planInputs = {
      ...(currentAgeField && { currentAge: currentAgeField.getValue() }),
      ...(retirementAgeField && { retirementAge: retirementAgeField.getValue() }),
      ...(lifeExpectancyField && { lifeExpectancy: lifeExpectancyField.getValue() }),
      ...(expenseWaveSlider && { monthlyExpense: expenseWaveSlider.getValue() }),
      ...(retirementExpenseRatio && {
        retirementExpenseRatio: retirementExpenseRatio.getValue(),
      }),
    };
    const scope = block.closest('.retirement-calculator') || block.closest('.section') || document;

    scope.retirementPlanInputs = planInputs;
    scope.dispatchEvent(new CustomEvent('retirement-plan-update', { detail: planInputs }));
  }

  block.addEventListener('retirement-plan-input-change', publishRetirementPlanInputs);

  const fields = [
    ['#currentAgeFieldSlot', currentAgeField],
    ['#retirementagefieldslot', retirementAgeField],
    ['#ageexpectancy', lifeExpectancyField],
    ['#waveslider', expenseWaveSlider],
    ['#expected-inflation', inflationField],
    ['#expected-return', returnField],
    ['#retirement-ration', retirementExpenseRatio],
  ];
  const retirecalc = ` <div class="calculator-modal">
    <div class="calculator-grid">
      <div class="calc-card">
        <div class="age-inputs-row">
          <div class="field-group" id="currentAgeFieldSlot"></div>
          <div class="field-group" id="retirementagefieldslot"></div>
          <div class="field-group" id="ageexpectancy">
        </div>
        </div>
        <div class="slider-box" id="waveslider"></div>
        <div class="two-columns-grid">
          <div class="slider-box" id="expected-inflation"></div>
          <div class="slider-box" id="expected-return"></div>
        </div>
        <div class="slider-box" id="retirement-ration"></div>
      </div>
  </div>`;
  block.innerHTML = fields.some(([, field]) => field) ? retirecalc : '';
  fields.forEach(([selector, field]) => {
    const slot = block.querySelector(selector);
    if (field) slot.appendChild(field.element);
    else slot?.remove();
  });
  block.querySelectorAll('.age-inputs-row, .two-columns-grid').forEach((group) => {
    if (!group.children.length) group.remove();
  });

  publishRetirementPlanInputs();
}

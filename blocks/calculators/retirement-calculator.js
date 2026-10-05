/**
 * Path: retirement-calculator.js
 */
import createAgeField from './fields/age-field/age-field.js';
import { createMonthlyExpenseWaveSlider } from './fields/monthly-expense-wave-slider/monthly-expense-wave-slider.js';
import createRateField from './fields/rate-field/rate-field.js';
import { createRetirementExpenseRatioField } from './fields/retirement-expense-ratio/retirement-expense-ratio.js';
export default function retirementCalculator(block) {
  function onPlanInputChange() {
    block.dispatchEvent(new Event('retirement-plan-input-change'));
  }

  const currentAgeField = createAgeField({
    id: 'currentAge',
    label: 'Current age',
    value: 30,
    min: 18,
    max: 100,
    onChange: onPlanInputChange
  });

  const retirementAgeField = createAgeField({
  id: 'retireAge',
  label: 'Retirement age',
  value: 60,
  min: 40,
  max: 80,
  onChange: onPlanInputChange
});

const lifeExpectancyField = createAgeField({
  id: 'lifeExpect',
  label: 'Life expected (age)',
  value: 80,
  min: 60,
  max: 100,
  onChange: onPlanInputChange
});

const expenseWaveSlider = createMonthlyExpenseWaveSlider({
  title: 'My monthly expense',
  required: true,
  infoText: 'Your current monthly cost of living',
  editable: true,
  value: 50000,
  min: 10000,
  max: 90000,
  step: 5000,
  milestones: [10000, 30000, 50000, 70000, 90000],
  onChange: onPlanInputChange
});

const inflationField = createRateField({
  id: 'inflationInput',
  label: 'Expected inflation rate',
    value: 5,
    min: 0,
    max: 15,
    step: 1,
    onChange: onPlanInputChange
  });

  const returnField = createRateField({
    id: 'returnInput',
    label: 'Expected return',
    infoText: 'Anticipated annual return on investment',
    value: 5, min: 0, max: 15, step: 1, onChange: onPlanInputChange
  });

  const retirementExpenseRatio = createRetirementExpenseRatioField({
    id: 'expPercentInput',
    value: 50, min: 0, max: 100, step: 1, onChange: onPlanInputChange
  });

  function publishRetirementPlanInputs() {
    const planInputs = {
      currentAge: currentAgeField.getValue(),
      retirementAge: retirementAgeField.getValue(),
      lifeExpectancy: lifeExpectancyField.getValue(),
      monthlyExpense: expenseWaveSlider.getValue(),
      retirementExpenseRatio: retirementExpenseRatio.getValue(),
    };
    const scope = block.closest('.retirement-calculator') || block.closest('.section') || document;

    scope.retirementPlanInputs = planInputs;
    scope.dispatchEvent(new CustomEvent('retirement-plan-update', { detail: planInputs }));
  }

  block.addEventListener('retirement-plan-input-change', publishRetirementPlanInputs);

  let retirecalc= ` <div class="calculator-modal">
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
  block.innerHTML = retirecalc;
  block.querySelector('#currentAgeFieldSlot').appendChild(currentAgeField.element);
  block.querySelector('#retirementagefieldslot').appendChild(retirementAgeField.element);
  block.querySelector('#ageexpectancy').appendChild(lifeExpectancyField.element);
  block.querySelector('#waveslider').appendChild(expenseWaveSlider.element);
  block.querySelector('#expected-inflation').appendChild(inflationField.element);
  block.querySelector('#expected-return').appendChild(returnField.element);
  block.querySelector('#retirement-ration').appendChild(retirementExpenseRatio.element);

  publishRetirementPlanInputs();

}
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
  const currentAgeLabel = block.querySelector('.current-age-field label').innerText.trim();
  const retirementAgeLabel = block.querySelector('.retirement-age-field label').innerText.trim();
  const lifeExpectedLabel = block.querySelector('.life-expected-field label').innerText.trim();
  const monthlyExpenseLabel = block.querySelector('.monthly-expense-field label').innerText.trim();
  const inflationRateLabel = block.querySelector('.inflation-rate-field label').innerText.trim();
  const expectedReturnLabel = block.querySelector('.expected-return-field label').innerText.trim();
  const expectedExpenseLabel = block.querySelector('.expected-expense-field label').innerText.trim();
  const currentAgeField = createAgeField({
    id: 'currentAge',
    label: currentAgeLabel,
    value: 30,
    min: 1,
    max: 80,
    onChange: onPlanInputChange,
  });

  const retirementAgeField = createAgeField({
    id: 'retireAge',
    label: retirementAgeLabel,
    value: 60,
    min: 30,
    max: 60,
    onChange: onPlanInputChange,
  });

  const lifeExpectancyField = createAgeField({
    id: 'lifeExpect',
    label: lifeExpectedLabel,
    value: 80,
    min: 60,
    max: 100,
    onChange: onPlanInputChange,
  });

  const expenseWaveSlider = createMonthlyExpenseWaveSlider({
    title: monthlyExpenseLabel,
    required: true,
    infoText: 'Your current monthly cost of living',
    editable: true,
    value: 40000,
    min: 1000,
    max: 1000000,
    step: 5000,
    milestones: [0, 200000, 400000, 600000, 800000, 1000000],
    onChange: onPlanInputChange,
  });

  const inflationField = createRateField({
    id: 'inflationInput',
    label: inflationRateLabel,
    value: 5,
    min: 1,
    max: 7,
    step: 1,
    milestones: [1, 3, 5, 7].map((val) => ({ val, text: `${val}%` })),
    onChange: onPlanInputChange,
  });

  const returnField = createRateField({
    id: 'returnInput',
    label: expectedReturnLabel,
    infoText: 'Anticipated annual return on investment',
    value: 5,
    min: 1,
    max: 15,
    step: 1,
    milestones: [0, 5, 10, 15].map((val) => ({ val, text: `${val}%` })),
    onChange: onPlanInputChange,
  });

  const retirementExpenseRatio = createRetirementExpenseRatioField({
    id: 'expPercentInput',
    label: expectedExpenseLabel,
    value: 75,
    min: 10,
    max: 100,
    step: 1,
    milestones: [10, 100].map((val) => ({ val, text: `${val}%` })),
    onChange: onPlanInputChange,
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

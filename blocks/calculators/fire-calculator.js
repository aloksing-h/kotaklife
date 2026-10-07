/**
 * Path: retirement-calculator.js
 */
import createAgeField from './fields/age-field/age-field.js';
import createMonthlyExpenseWaveSlider from './fields/monthly-expense-wave-slider/monthly-expense-wave-slider.js';
import createRetirementExpenseRatioField from './fields/retirement-expense-ratio/retirement-expense-ratio.js';

export default function fireCalculator(block) {
  function onPlanInputChange() {
    block.dispatchEvent(new Event('fire-plan-input-change'));
  }
  const currentAgeLabel = block.querySelector('.current-age-field label').innerText.trim();
  const retirementAgeLabel = block.querySelector('.retirement-age-field label').innerText.trim();
  const monthlyExpenseLabel = block.querySelector('.monthly-expense-field label').innerText.trim();
  const expectedExpenseLabel = block.querySelector('.expected-expense-field label').innerText.trim();

  const currentAgeField = createAgeField({
    id: 'currentAge',
    label: currentAgeLabel,
    value: 30,
    min: 18,
    max: 60,
    required: true,
    onChange: onPlanInputChange,
  });

  const retireAgeField = createAgeField({
    id: 'retireAge',
    label: retirementAgeLabel,
    value: 60,
    min: 30,
    max: 70,
    required: true,
    onChange: onPlanInputChange,
  });

  const expenseWaveSlider = createMonthlyExpenseWaveSlider({
    title: monthlyExpenseLabel,
    required: true,
    infoText: 'Your current monthly cost of living',
    editable: true,
    value: 40000,
    min: 5000,
    max: 500000,
    step: 5000,
    milestones: [5000, 100000, 200000, 300000, 400000, 5000000],
    onChange: onPlanInputChange,
  });

  const inflationrate = createRetirementExpenseRatioField({
    id: 'expPercentInput',
    label: expectedExpenseLabel,
    value: 75,
    min: 1,
    max: 10,
    step: 1,
    milestones: [1, 10].map((val) => ({ val, text: `${val}%` })),
    onChange: onPlanInputChange,
  });

  function publishFirePlanInputs() {
    const planInputs = {
      currentAge: currentAgeField.getValue(),
      retireAge: retireAgeField.getValue(),
      monthlyExpense: expenseWaveSlider.getValue(),
      inflationrate: inflationrate.getValue(),
    };
    const scope = block.closest('.fire-calculator') || block.closest('.section') || document;

    scope.firePlanInputs = planInputs;
    scope.dispatchEvent(new CustomEvent('fire-plan-update', { detail: planInputs }));
  }

  block.addEventListener('fire-plan-input-change', publishFirePlanInputs);

  const retirecalc = ` <div class="calculator-modal">
    <div class="calculator-grid">
      <div class="calc-card">
        <div class="age-inputs-row">
          <div class="field-group" id="currentAgeFieldSlot"></div>
          <div class="field-group" id="retirementagefieldslot"></div>
        </div>
        </div>
        <div class="slider-box" id="waveslider"></div>
        <div class="slider-box" id="retirement-ration"></div>
      </div>
  </div>`;
  block.innerHTML = retirecalc;
  block.querySelector('#currentAgeFieldSlot').appendChild(currentAgeField.element);
  block.querySelector('#retirementagefieldslot').appendChild(retireAgeField.element);
  block.querySelector('#waveslider').appendChild(expenseWaveSlider.element);
  block.querySelector('#retirement-ration').appendChild(inflationrate.element);

  publishFirePlanInputs();
}

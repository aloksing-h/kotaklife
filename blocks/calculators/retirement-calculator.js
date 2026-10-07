/**
 * Path: retirement-calculator.js
 */
import createAgeField from './fields/age-field/age-field.js';
import createMonthlyExpenseWaveSlider from './fields/monthly-expense-wave-slider/monthly-expense-wave-slider.js';
import createRateField from './fields/rate-field/rate-field.js';
import createRetirementExpenseRatioField from './fields/retirement-expense-ratio/retirement-expense-ratio.js';

export default function retirementCalculator(block) {
  console.log(block)
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

  const currentAgerange = block.querySelector('.current-age-range-field input').value.split(',').map((val) => Number(val.trim()));
  const retireAgeRange = block.querySelector('.desired-retirement-age-range-field input').value.split(',').map((val) => Number(val.trim()));
  const expectedAgeRange = block.querySelector('.life-expectation-range-field input').value.split(',').map((val) => Number(val.trim()));
  const monthlyExpenseRange = block.querySelector('.current-monthly-expense-range-field input').value.split(',').map((val) => Number(val.trim()));
  const inflationRange = block.querySelector('.expected-inflation-range-field input').value.split(',').map((val) => Number(val.trim()));
  const expecteReturnRange = block.querySelector('.expected-return-range-field input').value.split(',').map((val) => Number(val.trim()));
  const retirementExpenseRange = block.querySelector('.expected-expense-range-field input').value.split(',').map((val) => Number(val.trim()));

  const monthlyExpenseMilestone = block.querySelector('.monthly-expense-milestone-field input').value.split(',').map((val) => Number(val.trim()));
  const inlfationMilestone = block.querySelector('.expected-inflation-milestone-field input').value.split(',').map((val) => Number(val.trim()));
  const expectedReturnMilestone = block.querySelector('.expected-return-millstone-field input').value.split(',').map((val) => Number(val.trim()));
  const expecteExpenseMilestone = block.querySelector('.retirement-expense-milestone-field input').value.split(',').map((val) => Number(val.trim()));

  const currentAgeField = createAgeField({
    id: 'currentAge',
    label: currentAgeLabel,
    value: 30,
    min: currentAgerange[0],
    max: currentAgerange[1],
    required: true,
    onChange: onPlanInputChange,
  });

  const retirementAgeField = createAgeField({
    id: 'retireAge',
    label: retirementAgeLabel,
    value: 60,
    min: retireAgeRange[0],
    max: retireAgeRange[1],
    required: true,
    onChange: onPlanInputChange,
  });

  const lifeExpectancyField = createAgeField({
    id: 'lifeExpect',
    label: lifeExpectedLabel,
    value: 80,
    min: expectedAgeRange[0],
    max: expectedAgeRange[1],
    required: true,
    onChange: onPlanInputChange,
  });

  const expenseWaveSlider = createMonthlyExpenseWaveSlider({
    title: monthlyExpenseLabel,
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
    label: inflationRateLabel,
    value: 5,
    min: inflationRange[0],
    max: inflationRange[1],
    step: 1,
    milestones: inlfationMilestone.map((val) => ({ val, text: `${val}%` })),
    onChange: onPlanInputChange,
  });

  const returnField = createRateField({
    id: 'returnInput',
    label: expectedReturnLabel,
    infoText: 'Anticipated annual return on investment',
    value: 5,
    min: expecteReturnRange[0],
    max: expecteReturnRange[1],
    step: 1,
    milestones: expectedReturnMilestone.map((val) => ({ val, text: `${val}%` })),
    onChange: onPlanInputChange,
  });

  const retirementExpenseRatio = createRetirementExpenseRatioField({
    id: 'expPercentInput',
    label: expectedExpenseLabel,
    value: 75,
    min: retirementExpenseRange[0],
    max: retirementExpenseRange[1],
    step: 1,
    milestones: expecteExpenseMilestone.map((val) => ({ val, text: `${val}%` })),
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

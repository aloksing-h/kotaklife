/**
 * Path: retirement-calculator.js
 */
import createAgeField from './fields/age-field/age-field.js';
import { createMonthlyExpenseWaveSlider } from './fields/monthly-expense-wave-slider/monthly-expense-wave-slider.js';
import createRateField from './fields/rate-field/rate-field.js';
import { createRetirementExpenseRatioField } from './fields/retirement-expense-ratio/retirement-expense-ratio.js';
export default function compoundCalculator(block) {
  function onCompoundInputChange() {
    block.dispatchEvent(new Event('compound-plan-input-change'));
  }
let frequencyLabel = block.querySelector(".frequency-field label").innerText.trim();
let investAmountLabel = block.querySelector(".invest-amount-field label").innerText.trim();
let numberOfYearsLabel = block.querySelector(".number-of-years-field label").innerText.trim();
let numberOfYearsInvestedForLabel = block.querySelector(".number-of-year-invested-for-field label").innerText.trim();
let expectedInterestLabel = block.querySelector(".expected-interest-field label").innerText.trim();


const amountInvestedSlider = createMonthlyExpenseWaveSlider({
  title: investAmountLabel,
  required: true,
  infoText: 'Your current monthly cost of living',
  editable: true,
  value: 50000,
  min: 0,
  max: 500000,
  step: 5000,
  milestones: [0, 100000, 200000, 300000,400000, 500000],
  onChange: onCompoundInputChange
});

const numberOfYearsWantToInvest = createRateField({
  id: 'inflationInput',
  label: numberOfYearsLabel,
    value: 5,
    min: 0,
    max: 15,
    step: 1,
    onChange: onCompoundInputChange
  });

  const returnField = createRateField({
    id: 'returnInput',
    label: numberOfYearsInvestedForLabel,
    infoText: 'Anticipated annual return on investment',
    value: 5, min: 0, max: 15, step: 1, onChange: onCompoundInputChange
  });

  const retirementExpenseRatio = createRetirementExpenseRatioField({
    id: 'expPercentInput',
    label: expectedInterestLabel,
    value: 50, min: 0, max: 100, step: 1, onChange: onCompoundInputChange
  });

  function publishRetirementPlanInputs() {
    const planInputs = {
      currentAge: currentAgeField.getValue(),
      retirementAge: retirementAgeField.getValue(),
      lifeExpectancy: lifeExpectancyField.getValue(),
      monthlyExpense: expenseWaveSlider.getValue(),
      retirementExpenseRatio: retirementExpenseRatio.getValue(),
    };
    const scope = block.closest('.compound-calculator') || block.closest('.section') || document;

    scope.retirementPlanInputs = planInputs;
    scope.dispatchEvent(new CustomEvent('coumpound-plan-update', { detail: planInputs }));
  }

  block.addEventListener('compound-plan-input-change', publishRetirementPlanInputs);

  let retirecalc= ` <div class="calculator-modal">
    <div class="calculator-grid">
      <div class="calc-card">
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
  block.querySelector('#waveslider').appendChild(amountInvestedSlider.element);
  block.querySelector('#expected-inflation').appendChild(numberOfYearsWantToInvest.element);
  block.querySelector('#expected-return').appendChild(returnField.element);
  block.querySelector('#retirement-ration').appendChild(retirementExpenseRatio.element);

  publishRetirementPlanInputs();

}
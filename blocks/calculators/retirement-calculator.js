/**
 * Path: retirement-calculator.js
 */
import createAgeField from './fields/age-field/age-field.js';
import { createMonthlyExpenseWaveSlider } from './fields/monthly-expense-wave-slider/monthly-expense-wave-slider.js';
import createRateField from './fields/rate-field/rate-field.js';
import { createRetirementExpenseRatioField } from './fields/retirement-expense-ratio/retirement-expense-ratio.js';
import renderCalculatorResult from './calculator-result.js';
export default function retirementCalculator(block, variant = 'retirement', resultContent = {}) {

  const currentAgeField = createAgeField({
    id: 'currentAge',
    label: 'Current age',
    value: 30,
    min: 18,
    max: 100,
    onChange: calculateRetirementPlan
  });

  const retirementAgeField = createAgeField({
  id: 'retireAge',
  label: 'Retirement age',
  value: 60,
  min: 40,
  max: 80,
  onChange: calculateRetirementPlan
});

const lifeExpectancyField = createAgeField({
  id: 'lifeExpect',
  label: 'Life expected (age)',
  value: 80,
  min: 60,
  max: 100,
  onChange: calculateRetirementPlan
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
  onChange: calculateRetirementPlan
});

const inflationField = createRateField({
  id: 'inflationInput',
  label: 'Expected inflation rate',
    value: 5,
    min: 0,
    max: 15,
    step: 1,
    onChange: calculateRetirementPlan
  });

  const returnField = createRateField({
    id: 'returnInput',
    label: 'Expected return',
    infoText: 'Anticipated annual return on investment',
    value: 5, min: 0, max: 15, step: 1, onChange: calculateRetirementPlan
  });

  const retirementExpenseRatio = createRetirementExpenseRatioField({
    id: 'expPercentInput',
    value: 50, min: 0, max: 100, step: 1, onChange: calculateRetirementPlan
  });


// 3. Central Recalculation Trigger
  function calculateRetirementPlan() {
    if (variant !== 'retirement') return;
    const currentAge = Math.max(1, currentAgeField.getValue() || 30);
    const retireAge = Math.max(currentAge, retirementAgeField.getValue() || 60);
    const lifeExpect = Math.max(retireAge, lifeExpectancyField.getValue() || 80);
    const yearsToRetire = Math.max(0, retireAge - currentAge);
    const retirementDurationYears = Math.max(0, lifeExpect - retireAge);
    const annualExpensePostRetirement = expenseWaveSlider.getValue()
      * (retirementExpenseRatio.getValue() / 100) * 12;
    const estimatedFund = annualExpensePostRetirement * retirementDurationYears;
    const monthlySavings = yearsToRetire > 0 ? estimatedFund / (yearsToRetire * 12) : 0;
    const formatIndianCurrency = (amount) => `₹ ${Math.round(amount).toLocaleString('en-IN')}`;

    fundResult.textContent = formatIndianCurrency(estimatedFund);
    savingsTitle.textContent = freqToggle.checked
      ? (resultContent.savingsYearlyLabel || 'Required yearly savings')
      : (resultContent.savingsMonthlyLabel || 'Required monthly savings');
    savingsResult.textContent = formatIndianCurrency(freqToggle.checked
      ? monthlySavings * 12 : monthlySavings);
  }

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

      <div class="calc-card">
        ${renderCalculatorResult(variant, resultContent)}
      </div>

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

  const fundResult = block.querySelector('#fundResult');
  const savingsTitle = block.querySelector('#savingsTitle');
  const savingsResult = block.querySelector('#savingsResult');
  const freqToggle = block.querySelector('#freqToggle');
  if (freqToggle) freqToggle.addEventListener('change', calculateRetirementPlan);
  calculateRetirementPlan();

}
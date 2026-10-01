/**
 * Path: retirement-calculator.js
 */
import { createCurrentAgeField } from './fields/current-age/current-age.js';
import { createRetirementAgeField } from './fields/retirement-age/retirement-age.js';
import { createLifeExpectancyField } from './fields/life-expectancy/life-expectancy.js';
import { createMonthlyExpenseWaveSlider } from './fields/monthly-expense-wave-slider/monthly-expense-wave-slider.js';
import { createExpectedInflationField } from './fields/expected-inflation/expected-inflation.js';
import { createExpectedReturnField } from './fields/expected-return/expected-return.js';
import { createRetirementExpenseRatioField } from './fields/retirement-expense-ratio/retirement-expense-ratio.js';
export default function retirementCalculator(block) {

  const currentAgeField = createCurrentAgeField({
    value: 30,
    min: 18,
    max: 100,
    onChange: calculateRetirementPlan
  });

  const retirementAgeField = createRetirementAgeField({
  value: 60,
  min: 40,
  max: 80,
  onChange: calculateRetirementPlan
});

const lifeExpectancyField = createLifeExpectancyField({
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

const inflationField = createExpectedInflationField({
    value: 5,
    min: 0,
    max: 15,
    step: 1,
    onChange: calculateRetirementPlan
  });

  const returnField = createExpectedReturnField({
    id: 'returnInput',
    value: 5, min: 0, max: 15, step: 1, onChange: calculateRetirementPlan
  });

  const retirementExpenseRatio = createRetirementExpenseRatioField({
    id: 'expPercentInput',
    value: 50, min: 0, max: 100, step: 1, onChange: calculateRetirementPlan
  });


// 3. Central Recalculation Trigger
  function calculateRetirementPlan() {
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
      ? 'Required yearly savings' : 'Required monthly savings';
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

        <div class="fund-estimate-box">
          <p class="fund-estimate-label">Estimated retirement fund</p>
          <div class="fund-estimate-value" id="fundResult">₹ 97,04,512</div>
        </div>

        <div class="illustration-wrap">
          <svg class="couple-svg" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="55" cy="40" r="14" stroke="currentColor" stroke-width="2.2" fill="none"/>
            <path d="M32 98 C32 75, 78 75, 78 98" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
            <circle cx="105" cy="42" r="13" stroke="currentColor" stroke-width="2.2" fill="none"/>
            <path d="M84 98 C84 77, 126 77, 126 98" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
          </svg>
        </div>

        <div class="savings-summary-box">
          <div class="toggle-row">
            <span>Monthly</span>
            <label class="switch-label">
              <input type="checkbox" id="freqToggle">
              <span class="switch-knob"></span>
            </label>
            <span>Yearly</span>
          </div>

          <p class="savings-title-text" id="savingsTitle">Required monthly savings</p>
          <div class="savings-amount-text" id="savingsResult">₹ 26,957</div>
        </div>

        <button class="cta-plan-btn" type="button">
          <span>Start Your Planning Now</span>
          <span class="btn-circle-arrow">&rarr;</span>
        </button>

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
  freqToggle.addEventListener('change', calculateRetirementPlan);
  calculateRetirementPlan();

}
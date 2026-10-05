import { createFrequencyDropdownField } from './fields/dropdown-field/dropdown-field.js';
import { createMonthlyExpenseWaveSlider } from './fields/monthly-expense-wave-slider/monthly-expense-wave-slider.js';
import createRateField from './fields/rate-field/rate-field.js';
import { createRetirementExpenseRatioField } from './fields/retirement-expense-ratio/retirement-expense-ratio.js';

export function calculateCompoundInterest({
  investmentAmount, investmentYears, holdingYears, rate, frequency = 12,
}) {
  if (!Number.isFinite(investmentAmount) || investmentAmount < 0
    || !Number.isInteger(investmentYears) || investmentYears < 0
    || !Number.isInteger(holdingYears) || holdingYears < 0
    || !Number.isFinite(rate) || rate < 0
    || ![1, 2, 4, 12].includes(frequency)) {
    throw new RangeError('Invalid compound interest inputs');
  }

  const monthlyRate = rate / 100 / 12;
  const contributionInterval = 12 / frequency;
  const yearlyData = [];
  const startYear = new Date().getFullYear();
  const totalYears = Math.max(investmentYears, holdingYears);
  let currentBalance = 0;

  for (let year = 1; year <= totalYears; year += 1) {
    for (let month = 0; month < 12; month += 1) {
      if (year <= investmentYears && month % contributionInterval === 0) {
        currentBalance += investmentAmount;
      }
      currentBalance += currentBalance * monthlyRate;
    }

    yearlyData.push({
      year: startYear + year - 1,
      balance: Math.round(currentBalance),
    });
  }

  return {
    finalAmount: yearlyData.length ? yearlyData[yearlyData.length - 1].balance : 0,
    yearlyData,
  };
}

export default function compoundCalculator(block) {
  function onCompoundInputChange() {
    block.dispatchEvent(new Event('compound-plan-input-change'));
  }

  const getLabel = (selector, fallback) => block.querySelector(`${selector} label`)?.textContent.trim() || fallback;
  const frequencyField = createFrequencyDropdownField({
    id: 'frequencySelect',
    label: getLabel('.frequency-field', 'Frequency'),
    value: '30',
    onChange: onCompoundInputChange,
  });

  const amountInvestedSlider = createMonthlyExpenseWaveSlider({
    title: getLabel('.invest-amount-field', 'Investment amount'),
    required: true,
    infoText: 'Amount contributed at the start of each selected investment period',
    editable: true,
    value: 50000,
    min: 0,
    max: 500000,
    step: 5000,
    milestones: [0, 100000, 200000, 300000, 400000, 500000],
    onChange: onCompoundInputChange,
  });

  const investmentYearsField = createRateField({
    id: 'investmentYearsInput',
    label: getLabel('.number-of-years-field', 'Investment years'),
    value: 5,
    min: 0,
    max: 15,
    step: 1,
    milestones: [0, 5, 10, 15].map((val) => ({ val, text: `${val}` })),
    onChange: onCompoundInputChange,
  });

  const holdingYearsField = createRateField({
    id: 'holdingYearsInput',
    label: getLabel('.number-of-year-invested-for-field', 'Holding years'),
    value: 5,
    min: 0,
    max: 15,
    step: 1,
    milestones: [0, 5, 10, 15].map((val) => ({ val, text: `${val}` })),
    onChange: onCompoundInputChange,
  });

//   [investmentYearsField, holdingYearsField].forEach((field) => {
//     field.element.querySelector('.badge-affix').textContent = 'years';
//   });

  const interestRateField = createRetirementExpenseRatioField({
    id: 'interestRateInput',
    label: getLabel('.expected-interest-field', 'Expected annual interest rate'),
    value: 50,
    min: 0,
    max: 100,
    step: 1,
    onChange: onCompoundInputChange,
  });

  function publishCompoundPlanInputs() {
    const frequencies = {
      30: 12, 90: 4, 180: 2, 365: 1,
    };
    const planInputs = {
      investmentAmount: amountInvestedSlider.getValue(),
      investmentYears: investmentYearsField.getValue(),
      holdingYears: holdingYearsField.getValue(),
      rate: interestRateField.getValue(),
      frequency: frequencies[frequencyField.getValue()],
    };
    const result = calculateCompoundInterest(planInputs);
    const scope = block.closest('.compound-calculator') || block.closest('.section') || document;

    scope.compoundPlanInputs = planInputs;
    scope.compoundPlanResult = result;
    scope.dispatchEvent(new CustomEvent('compound-plan-update', {
      detail: { ...planInputs, ...result },
    }));
  }

  block.addEventListener('compound-plan-input-change', publishCompoundPlanInputs);

  block.innerHTML = `<div class="calculator-modal">
    <div class="calculator-grid">
      <div class="calc-card">
        <div class="age-inputs-row">
          <div class="field-group" id="frequency"></div>
        </div>
        <div class="slider-box" id="amountInvestedSlider"></div>
        <div class="two-columns-grid">
          <div class="slider-box" id="number-of-years"></div>
          <div class="slider-box" id="number-of-years-invested-for"></div>
        </div>
        <div class="slider-box" id="interest-rate"></div>
      </div>
    </div>
  </div>`;
  block.querySelector('#frequency').appendChild(frequencyField.element);
  block.querySelector('#amountInvestedSlider').appendChild(amountInvestedSlider.element);
  block.querySelector('#number-of-years').appendChild(investmentYearsField.element);
  block.querySelector('#number-of-years-invested-for').appendChild(holdingYearsField.element);
  block.querySelector('#interest-rate').appendChild(interestRateField.element);

  publishCompoundPlanInputs();
}

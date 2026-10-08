import createFrequencyDropdownField from './fields/dropdown-field/dropdown-field.js';
import createMonthlyExpenseWaveSlider from './fields/monthly-expense-wave-slider/monthly-expense-wave-slider.js';
import createRateField from './fields/rate-field/rate-field.js';
import createRetirementExpenseRatioField from './fields/retirement-expense-ratio/retirement-expense-ratio.js';

export function calculateCompoundInterest({
  investmentAmount, investmentYears, holdingYears, rate, frequency = 12,
}) {
  if (!Number.isFinite(investmentAmount) || investmentAmount < 0
    || !Number.isInteger(investmentYears) || investmentYears < 0
    || !Number.isInteger(holdingYears) || holdingYears < investmentYears
    || !Number.isFinite(rate) || rate < 0
    || ![1, 2, 4, 12].includes(frequency)) {
    throw new RangeError('Invalid compound interest inputs');
  }

  const periodRate = rate / 100 / frequency;
  const yearlyData = [];
  const startYear = new Date().getFullYear();
  let currentBalance = 0;

  for (let year = 1; year <= holdingYears; year += 1) {
    for (let period = 0; period < frequency; period += 1) {
      if (year <= investmentYears) {
        currentBalance += investmentAmount;
      }
      currentBalance += currentBalance * periodRate;
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
  let investmentYearsField;
  let holdingYearsField;

  function onCompoundInputChange() {
    if (holdingYearsField.getValue() < investmentYearsField.getValue()) {
      holdingYearsField.setValue(investmentYearsField.getValue());
    }
    block.dispatchEvent(new Event('compound-plan-input-change'));
  }

  const getConfiguredValues = (selector, fallback) => {
    const input = block.querySelector(`${selector} input`);
    if (!input?.value.trim()) return fallback;
    const values = input.value.split(',').map((value) => Number(value.trim()));
    return values.every(Number.isFinite) ? values : fallback;
  };

  const getLabel = (selector, fallback) => block.querySelector(`${selector} label`)?.textContent.trim() || fallback;
  const investmentAmountRange = getConfiguredValues('.invest-amount-range-field', [5000, 1000000]);
  const investmentYearsRange = getConfiguredValues('.want-to-invest-range-field', [1, 30]);
  const holdingYearsRange = getConfiguredValues('.stay-invested-years-range-field', [1, 50]);
  const interestRateRange = getConfiguredValues('.expected-interest-range-field', [1, 30]);
  const investmentAmountMilestones = getConfiguredValues('.invest-amount-milestone-field', [5000, 200000, 400000, 600000, 800000, 1000000]);
  const investmentYearsMilestones = getConfiguredValues('.want-to-invest-milestone-field', investmentYearsRange);
  const holdingYearsMilestones = getConfiguredValues('.stay-invested-years-milestone-field', holdingYearsRange);

  const frequencyField = createFrequencyDropdownField({
    id: 'frequencySelect',
    label: getLabel('.frequency-field', 'Frequency'),
    value: '30',
    required: true,
    onChange: onCompoundInputChange,
  });

  const amountInvestedSlider = createMonthlyExpenseWaveSlider({
    title: getLabel('.invest-amount-field', 'Investment amount'),
    infoText: 'Amount contributed at the start of each selected investment period',
    editable: true,
    value: 50000,
    min: investmentAmountRange[0],
    max: investmentAmountRange[1],
    step: 5000,
    milestones: investmentAmountMilestones,
    onChange: onCompoundInputChange,
  });

  investmentYearsField = createRateField({
    id: 'investmentYearsInput',
    label: getLabel('.number-of-years-field', 'Investment years'),
    value: 5,
    min: investmentYearsRange[0],
    max: investmentYearsRange[1],
    step: 1,
    milestones: investmentYearsMilestones.map((val) => ({ val, text: `${val} Year` })),
    onChange: onCompoundInputChange,
  });

  holdingYearsField = createRateField({
    id: 'holdingYearsInput',
    label: getLabel('.number-of-year-invested-for-field', 'Holding years'),
    value: 5,
    min: holdingYearsRange[0],
    max: holdingYearsRange[1],
    step: 1,
    milestones: holdingYearsMilestones.map((val) => ({ val, text: `${val} Year` })),
    onChange: onCompoundInputChange,
  });

  //   [investmentYearsField, holdingYearsField].forEach((field) => {
  //     field.element.querySelector('.badge-affix').textContent = 'years';
  //   });

  const interestRateField = createRetirementExpenseRatioField({
    id: 'interestRateInput',
    label: getLabel('.expected-interest-field', 'Expected annual interest rate'),
    value: 15,
    min: interestRateRange[0],
    max: interestRateRange[1],
    step: 1,
    milestones: interestRateRange.map((val) => ({ val, text: `${val}%` })),
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

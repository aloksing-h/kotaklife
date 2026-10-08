export default async function decorate(block) {
  const getRow = (index) => block.children[index];
  const getText = (index) => getRow(index)?.querySelector('p')?.textContent.trim() || '';

  const summaryTitle = getText(0);
  const summaryImage = getRow(1)?.querySelector('picture')?.cloneNode(true);
  const imageAltText = getText(2);
  const monthlyLabel = getText(3);
  const yearlyLabel = getText(4);
  const monthlySavingsTitle = getText(5);
  const yearlySavingsTitle = getText(6);
  const buttonTitle = getText(7);
  const buttonLink = getRow(8)?.querySelector('a')?.getAttribute('href')?.trim();

  if (summaryImage) {
    const image = summaryImage.querySelector('img');
    if (image) image.alt = imageAltText;
  }

  const card = document.createElement('div');
  card.className = 'calc-card';
  const resultContent = document.createElement('div');
  resultContent.className = 'result-summary-content';

  const fundBox = document.createElement('div');
  fundBox.className = 'fund-estimate-box';
  const fundLabel = document.createElement('p');
  fundLabel.className = 'fund-estimate-label';
  fundLabel.textContent = summaryTitle;
  const fundValue = document.createElement('div');
  fundValue.className = 'fund-estimate-value';
  fundValue.id = 'fundResult';
  fundValue.textContent = '--';
  fundBox.append(fundLabel, fundValue);

  const illustration = document.createElement('div');
  illustration.className = 'illustration-wrap';
  if (summaryImage) illustration.append(summaryImage);

  const savingsBox = document.createElement('div');
  savingsBox.className = 'savings-summary-box';

  const toggleRow = document.createElement('div');
  toggleRow.className = 'toggle-row';
  const monthlyText = document.createElement('span');
  monthlyText.textContent = monthlyLabel;
  const toggleLabel = document.createElement('label');
  toggleLabel.className = 'switch-label';
  const frequencyToggle = document.createElement('input');
  frequencyToggle.type = 'checkbox';
  frequencyToggle.id = 'freqToggle';
  frequencyToggle.setAttribute('aria-label', `${monthlyLabel} or ${yearlyLabel}`);
  const toggleKnob = document.createElement('span');
  toggleKnob.className = 'switch-knob';
  toggleLabel.append(frequencyToggle, toggleKnob);
  const yearlyText = document.createElement('span');
  yearlyText.textContent = yearlyLabel;
  toggleRow.append(monthlyText, toggleLabel, yearlyText);

  const savingsTitle = document.createElement('p');
  savingsTitle.className = 'savings-title-text';
  savingsTitle.id = 'savingsTitle';
  savingsTitle.textContent = monthlySavingsTitle;
  const savingsValue = document.createElement('div');
  savingsValue.className = 'savings-amount-text';
  savingsValue.id = 'savingsResult';
  savingsValue.textContent = '--';
  savingsBox.append(toggleRow, savingsTitle, savingsValue);

  const savingsContent = document.createElement('div');
  savingsContent.className = 'result-summary-details';
  savingsContent.append(illustration, savingsBox);
  resultContent.append(savingsContent);

  if (buttonTitle && buttonLink) {
    const ctaContent = document.createElement('div');
    ctaContent.className = 'result-summary-action';
    const cta = document.createElement('a');
    cta.className = 'cta-plan-btn';
    cta.href = buttonLink;
    cta.textContent = buttonTitle;
    ctaContent.append(cta);
    resultContent.append(ctaContent);
  }

  card.append(fundBox, resultContent);
  block.replaceChildren(card);

  let latestPlanInputs;
  const scope = block.closest('.retirement-calculator') || block.closest('.section') || document;

  function calculateRetirementPlan(inputs) {
    if (!inputs) return;
    latestPlanInputs = inputs;

    const currentAge = Number(inputs.currentAge) || 30;
    const retirementAge = Number(inputs.retirementAge) || 60;
    const lifeExpectancy = Number(inputs.lifeExpectancy) || 80;
    const yearsToRetirement = retirementAge - currentAge;
    const retirementDuration = lifeExpectancy - retirementAge;
    const annualRetirementExpense = Number(inputs.monthlyExpense)
      * (Number(inputs.retirementExpenseRatio) / 100) * 12;
    const estimatedFund = annualRetirementExpense * retirementDuration;
    const monthlySavings = yearsToRetirement !== 0
      ? estimatedFund / (yearsToRetirement * 12)
      : 0;
    const formatIndianCurrency = (amount) => `₹ ${Math.round(amount).toLocaleString('en-IN')}`;

    fundValue.textContent = formatIndianCurrency(estimatedFund);
    savingsTitle.textContent = frequencyToggle.checked ? yearlySavingsTitle : monthlySavingsTitle;
    savingsValue.textContent = formatIndianCurrency(frequencyToggle.checked
      ? monthlySavings * 12
      : monthlySavings);
  }

  function updateFrequencyLabels() {
    monthlyText.classList.toggle('is-selected', !frequencyToggle.checked);
    yearlyText.classList.toggle('is-selected', frequencyToggle.checked);
  }

  scope.addEventListener('retirement-plan-update', (event) => {
    calculateRetirementPlan(event.detail);
  });
  frequencyToggle.addEventListener('change', () => {
    updateFrequencyLabels();
    calculateRetirementPlan(latestPlanInputs);
  });
  updateFrequencyLabels();
  calculateRetirementPlan(scope.retirementPlanInputs);
}

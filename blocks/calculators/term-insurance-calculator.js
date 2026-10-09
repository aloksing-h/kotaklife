import createGenderField from './fields/gender-field/gender-field.js';
import createInputField from './fields/input-field/input-field.js';
import createMonthlyExpenseWaveSlider from './fields/monthly-expense-wave-slider/monthly-expense-wave-slider.js';
import createTobaccoField from './fields/tobacco-field/tobacco-field.js';

export default function termInsuranceCalculator(block) {
  const findField = (selectors) => {
    const candidates = Array.isArray(selectors) ? selectors : [selectors];
    return candidates.map((selector) => block.querySelector(selector)).find(Boolean);
  };
  const getControl = (selectors) => {
    const field = findField(selectors);
    if (!field) return null;
    return field.matches('input, select') ? field : field.querySelector('input, select');
  };
  const getLabel = (selectors, fallback) => {
    const field = findField(selectors);
    return field?.querySelector('label, legend')?.textContent.trim() || fallback;
  };
  const getValues = (selectors, fallback) => {
    const input = getControl(selectors);
    if (!input?.value.trim()) return fallback;
    const values = input.value.split(',').map((value) => Number(value.trim()));
    return values.every(Number.isFinite) ? values : fallback;
  };
  const getOptions = (selectors, fallback, fieldLabel) => {
    const field = findField(selectors) || (fieldLabel && [...block.querySelectorAll('fieldset, .form-field')]
      .find((candidate) => candidate.querySelector('legend, label')?.textContent.trim()
        .toLowerCase().startsWith(fieldLabel.toLowerCase())));
    const select = field?.matches('select') ? field : field?.querySelector('select');
    if (select) {
      const options = [...select.options]
        .filter((option) => option.value)
        .map((option) => ({ label: option.textContent.trim(), value: option.value }));
      if (options.length) return options;
    }

    const radioInputs = field?.matches('input[type="radio"]')
      ? [field]
      : [...(field?.querySelectorAll('input[type="radio"]') || [])];
    if (radioInputs.length) {
      return radioInputs.map((input) => ({
        label: input.closest('label')?.textContent.trim() || input.value,
        value: input.value.toLowerCase(),
      }));
    }

    return fallback;
  };
  const getInitialValue = (selectors, fallback) => getControl(selectors)?.value || fallback;
  const getRange = (selectors, fallback) => {
    const values = getValues(selectors, fallback);
    return values.length >= 2 && values[0] < values[1] ? values.slice(0, 2) : fallback;
  };
  const formatDateInput = (date) => [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
  const getDateOfBirthForAge = (age) => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - age);
    return formatDateInput(date);
  };
  const minimumDateOfBirth = getDateOfBirthForAge(65);
  const maximumDateOfBirth = getDateOfBirthForAge(18);

  const lifeCoverRange = getRange(['.life-cover-range-field', '.life-cover-range'], [10000, 1000000]);
  const lifeCoverMilestones = getValues(
    ['.life-cover-milestones-field', '.life-cover-milestones'],
    [10000, 200000, 400000, 600000, 800000, 1000000],
  );
  const educationOptions = getOptions(['.education-select-field', '.education-select'], [
    { label: 'Graduate', value: 'graduate' },
    { label: 'Post graduate', value: 'post-graduate' },
  ]);
  const genderOptions = getOptions(['.radio-input-field', '.radio-input', '.radio-field'], [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
  ]);
  const tobaccoOptions = getOptions(['.checkbox-input-field', '.checkbox-input', '.checkbox-field'], [
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
  ], 'Tobacco user');
  function onPlanInputChange() {
    block.dispatchEvent(new Event('term-plan-input-change'));
  }

  const fullNameField = createInputField({
    id: 'termFullName',
    label: getLabel(['.name-input-field', '.name-input'], 'Full name'),
    placeholder: 'Name',
    required: true,
    onChange: onPlanInputChange,
  });
  const phoneField = createInputField({
    id: 'termPhone',
    label: getLabel(['.phone-input-field', '.phone-input'], 'Phone no'),
    type: 'tel',
    placeholder: '+91 9876511232',
    required: true,
    onChange: onPlanInputChange,
  });
  const emailField = createInputField({
    id: 'termEmail',
    label: getLabel(['.email-input-field', '.email-input'], 'Email'),
    type: 'email',
    placeholder: 'name@example.com',
    required: true,
    onChange: onPlanInputChange,
  });
  const dateOfBirthField = createInputField({
    id: 'termDateOfBirth',
    label: getLabel(['.dob-input-field', '.dob-input'], 'Date of birth'),
    type: 'date',
    min: minimumDateOfBirth,
    max: maximumDateOfBirth,
    required: true,
    onChange: onPlanInputChange,
  });
  const educationField = createInputField({
    id: 'termEducation',
    label: getLabel(['.education-select-field', '.education-select'], 'Education'),
    type: 'select',
    value: getInitialValue(['.education-select-field', '.education-select'], educationOptions[0].value),
    options: educationOptions,
    required: true,
    onChange: onPlanInputChange,
  });
  const occupationField = createInputField({
    id: 'termOccupation',
    label: getLabel(['.occupation-input-field', '.occupation-input'], 'Occupation'),
    value: getInitialValue(['.occupation-input-field', '.occupation-input'], ''),
    required: true,
    onChange: onPlanInputChange,
  });
  const annualIncomeField = createInputField({
    id: 'termAnnualIncome',
    label: getLabel(['.annual-income-input-field', '.annual-income-input'], 'Annual income'),
    type: 'number',
    value: getInitialValue('.annual-income-field', '1200000'),
    min: 0,
    required: true,
    onChange: onPlanInputChange,
  });
  const lifeCoverSlider = createMonthlyExpenseWaveSlider({
    id: 'termLifeCover',
    title: getLabel(['.life-cover-input-field', '.life-cover-input'], 'Life cover'),
    required: true,
    infoText: 'Choose the life cover amount you need',
    editable: true,
    value: Math.min(lifeCoverRange[1], Math.max(lifeCoverRange[0], 1000000)),
    min: lifeCoverRange[0],
    max: lifeCoverRange[1],
    step: 10000,
    milestones: lifeCoverMilestones,
    onChange: onPlanInputChange,
  });
  const genderField = createGenderField({
    id: 'termGender',
    label: getLabel(['.radio-input-field', '.radio-input', '.radio-field'], 'Gender'),
    required: true,
    value: 'male',
    optionsList: genderOptions,
    onChange: onPlanInputChange,
  });
  const tobaccoField = createTobaccoField({
    id: 'termTobaccoUser',
    label: getLabel(['.checkbox-input-field', '.checkbox-input', '.checkbox-field'], 'Tobacco user'),
    required: true,
    value: tobaccoOptions[0].value,
    optionsList: tobaccoOptions,
    onChange: onPlanInputChange,
  });

  block.innerHTML = `<div class="term-insurance-calculator">
    <form class="term-insurance-form" novalidate>
      <div class="term-insurance-fields">
        <div class="term-input-slot" id="termFullNameSlot"></div>
        <div class="term-input-slot" id="termPhoneSlot"></div>
        <div class="term-input-slot" id="termEmailSlot"></div>
        <div class="term-input-slot" id="termDateOfBirthSlot"></div>
        <div class="term-input-slot" id="termEducationSlot"></div>
        <div class="term-input-slot" id="termOccupationSlot"></div>
        <div class="term-input-slot" id="termAnnualIncomeSlot"></div>
        <div class="term-insurance-cover slider-box" id="termLifeCoverSlot"></div>
        <div class="term-insurance-preferences">
          <div class="term-preference-slot" id="termGenderSlot"></div>
          <div class="term-preference-slot" id="termTobaccoSlot"></div>
        </div>
      </div>
    </form>
  </div>`;

  block.querySelector('#termFullNameSlot').append(fullNameField.element);
  block.querySelector('#termPhoneSlot').append(phoneField.element);
  block.querySelector('#termEmailSlot').append(emailField.element);
  block.querySelector('#termDateOfBirthSlot').append(dateOfBirthField.element);
  block.querySelector('#termEducationSlot').append(educationField.element);
  block.querySelector('#termOccupationSlot').append(occupationField.element);
  block.querySelector('#termAnnualIncomeSlot').append(annualIncomeField.element);
  block.querySelector('#termLifeCoverSlot').append(lifeCoverSlider.element);
  block.querySelector('#termGenderSlot').append(genderField.element);
  block.querySelector('#termTobaccoSlot').append(tobaccoField.element);

  function publishTermPlanInputs() {
    const planInputs = {
      fullName: fullNameField.input.value,
      phone: phoneField.input.value,
      email: emailField.input.value,
      dateOfBirth: dateOfBirthField.input.value,
      education: educationField.input.value,
      occupation: occupationField.input.value,
      annualIncome: Number(annualIncomeField.input.value),
      lifeCover: lifeCoverSlider.getValue(),
      gender: genderField.getValue(),
      tobaccoUser: tobaccoField.getValue(),
    };
    const scope = block.closest('.term-inurance-text') || block.closest('.section') || document;
    scope.termPlanInputs = planInputs;
    scope.dispatchEvent(new CustomEvent('term-plan-update', {
      detail: planInputs,
      bubbles: true,
    }));
  }

  block.addEventListener('term-plan-input-change', publishTermPlanInputs);
  publishTermPlanInputs();
}

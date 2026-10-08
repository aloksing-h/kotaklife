import { toCamelCase, toClassName } from '../../scripts/aem.js';
import initDatePicker from '../../scripts/date-picker.js';

/**
 * Creates an HTML element with an optional class name
 * @param {string} tag - HTML tag name
 * @param {string} [className] - Optional CSS class name
 * @returns {HTMLElement} Created element
 */
function createElement(tag, className) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  return el;
}

/**
 * Generates a camelCase ID from a name and optional option
 * @param {string} name - Base name for the ID
 * @param {string} [option] - Optional value to append to the ID
 * @returns {string} Generated camelCase ID
 */
function generateId(name, option = null) {
  const id = toCamelCase(name);
  return option ? `${id}-${toCamelCase(option)}` : id;
}

/**
 * Creates a help text paragraph with a unique ID
 * @param {string} text - Help text content
 * @param {string} inputId - ID of the associated input field
 * @returns {HTMLParagraphElement} Help text element
 */
function writeHelpText(text, inputId) {
  const help = createElement('p', 'field-help-text');
  help.textContent = text;
  help.id = `${inputId}-help`;
  return help;
}

/**
 * Creates an error message span for a field
 * @param {string} message - Validation message text
 * @returns {HTMLSpanElement} Error message element
 */
function writeValidationMessage(message) {
  const errorSpan = createElement('span', 'error-message');
  errorSpan.textContent = message;
  return errorSpan;
}

/**
 * Creates a label or legend element
 * @param {string} text - Label text content
 * @param {string} [type='label'] - Either 'label' or 'legend'
 * @param {string} [id] - ID of the associated input (for 'label' type only)
 * @param {boolean} [required] - Whether the field is required
 * @returns {HTMLElement} Label or legend element
 */
function buildLabel(text, type = 'label', id = null, required = false) {
  const label = createElement(type);
  label.innerHTML = text;
  if (id && type === 'label') label.setAttribute('for', id);
  if (required) label.dataset.required = 'true';
  return label;
}

/**
 * Creates an input element with specified attributes, including the
 * authored min/max/validation-regex metadata used by this form's skin
 * @param {Object} field - Field configuration object
 * @returns {HTMLInputElement} Input element
 */
function buildInput(field) {
  const {
    type, field: fieldName, required, default: defaultValue, placeholder, min, max, validationRegex,
  } = field;

  const input = createElement('input');
  input.id = generateId(fieldName);
  input.name = input.id;
  input.required = required === 'true';
  if (defaultValue !== undefined && defaultValue !== null) input.defaultValue = defaultValue;

  if (max) {
    if (type === 'date' || type === 'number') input.setAttribute('max', max);
    else input.setAttribute('maxlength', max);
  }
  if (min && (type === 'date' || type === 'number')) input.setAttribute('min', min);
  if (type === 'tel' && !max) input.setAttribute('maxlength', '10');
  if (validationRegex) input.dataset.regex = validationRegex;

  if (type === 'date') {
    // Keep as text so Flatpickr handles the calendar and users can type DD/MM/YYYY
    input.type = 'text';
    input.setAttribute('maxlength', '10');
    if (placeholder) input.placeholder = placeholder;
  } else {
    input.type = type || 'text';
    if (placeholder) input.placeholder = placeholder;
  }

  return input;
}

/**
 * Creates a textarea element
 * @param {Object} field - Field configuration object
 * @returns {HTMLTextAreaElement} Textarea element
 */
function buildTextArea(field) {
  const {
    field: fieldName, required, default: defaultValue, placeholder,
  } = field;

  const textarea = createElement('textarea');
  textarea.id = generateId(fieldName);
  textarea.name = textarea.id;
  textarea.required = required === 'true';
  textarea.rows = 5;
  if (defaultValue) textarea.value = defaultValue;
  if (placeholder) textarea.placeholder = placeholder;
  return textarea;
}

/**
 * Creates a radio/checkbox input for an option
 * @param {Object} field - Field configuration object
 * @param {string} option - Option value
 * @returns {HTMLInputElement} Radio/checkbox input
 */
function buildOptionInput(field, option) {
  const {
    type, field: fieldName, default: defaultValue, required,
  } = field;
  const id = generateId(fieldName, option);

  const input = createElement('input');
  input.type = type;
  input.id = id;
  input.name = generateId(fieldName);
  input.value = option;
  input.checked = option === defaultValue;
  input.required = required === 'true';

  return input;
}

/**
 * Creates a fieldset containing radio/checkbox options
 * @param {Object} field - Field configuration object
 * @param {string} controlled - Controlled field name
 * @returns {HTMLFieldSetElement} Fieldset containing options
 */
function buildOptions(field, controlled) {
  const {
    type, options, label, required, validationMessage,
  } = field;
  if (!options) return null;

  const fieldset = createElement('fieldset', `form-field ${type}-field`);
  if (controlled) {
    const controller = controlled.split('-')[0];
    fieldset.dataset.controller = controller;
    fieldset.dataset.condition = controlled;
  }
  fieldset.append(buildLabel(label, 'legend', null, required === 'true'));

  options.split(' , ').forEach((o) => {
    const option = o.trim();
    const input = buildOptionInput(field, option);
    const span = createElement('span');
    const labelEl = buildLabel(option, 'label', input.id);
    labelEl.prepend(input, span);
    fieldset.append(labelEl);
  });

  if (validationMessage) fieldset.append(writeValidationMessage(validationMessage));

  return fieldset;
}

/**
 * Fetches select options from a remote URL
 * @param {URL} url - URL to fetch options from
 * @returns {Promise<Array<HTMLOptionElement>>} Array of option elements
 */
async function buildOptionsFromUrl(url) {
  const resp = await fetch(url);
  const { data } = await resp.json();
  const options = data.map((o) => {
    const { option, value } = o;
    const optionEl = createElement('option');
    if (option && value) {
      optionEl.value = value;
      optionEl.textContent = option;
    } else if (option && !value) {
      optionEl.value = option;
      optionEl.textContent = option;
    } else if (value && !option) {
      optionEl.value = value;
      optionEl.textContent = value;
    }
    return optionEl;
  });
  return options;
}

/**
 * Creates a select dropdown field
 * @param {Object} field - Field configuration object
 * @param {string} controlled - Controlled field name
 * @returns {HTMLElement} Wrapper div containing select element
 */
function buildSelect(field, controlled) {
  const {
    type, options, field: fieldName, label, required, placeholder, validationMessage,
  } = field;
  if (!options) return null;

  const wrapper = createElement('div', `form-field ${type}-field`);
  if (controlled) {
    const controller = controlled.split('-')[0];
    wrapper.dataset.controller = controller;
    wrapper.dataset.condition = controlled;
  }

  const selectId = generateId(fieldName);
  wrapper.append(buildLabel(label, 'label', selectId, required === 'true'));

  const select = createElement('select');
  select.id = selectId;
  select.name = select.id;
  select.required = required === 'true';
  wrapper.append(select);

  if (placeholder) {
    const placeholderOption = createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = placeholder;
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    select.append(placeholderOption);
  }

  try {
    const url = new URL(options);
    buildOptionsFromUrl(url).then((os) => { select.append(...os); });
  } catch (error) {
    options.split(',').forEach((o) => {
      const option = o.trim();
      const optionEl = createElement('option');
      optionEl.value = option;
      optionEl.textContent = option;
      select.append(optionEl);
    });
  }

  if (validationMessage) wrapper.append(writeValidationMessage(validationMessage));

  return wrapper;
}

/**
 * Creates a toggle switch field (styled checkbox)
 * @param {Object} field - Field configuration object
 * @param {string} controlled - Controlled field name
 * @returns {HTMLElement} Wrapper div containing toggle switch
 */
function buildToggle(field, controlled) {
  const {
    label, required, default: defaultValue,
  } = field;

  const wrapper = createElement('div', 'form-field toggle-field');
  if (controlled) {
    const controller = controlled.split('-')[0];
    wrapper.dataset.controller = controller;
    wrapper.dataset.condition = controlled;
  }

  const input = buildOptionInput({ ...field, type: 'checkbox' }, defaultValue || 'true');
  input.setAttribute('role', 'switch');
  input.setAttribute('aria-checked', input.checked);

  input.addEventListener('change', () => {
    input.setAttribute('aria-checked', input.checked);
  });

  const span = createElement('span');
  const labelEl = buildLabel(label, 'label', input.id, required === 'true');
  labelEl.prepend(input, span);
  wrapper.append(labelEl);

  return wrapper;
}

/**
 * Creates a button element
 * @param {Object} field - Field configuration object
 * @returns {HTMLButtonElement} Button element
 */
function buildButton(field) {
  const { type, label, icon } = field;
  const button = createElement('button');
  button.className = 'button';
  button.type = type;
  const textSpan = createElement('span');
  textSpan.textContent = label;
  button.append(textSpan);

  if (icon) {
    const iconWrapper = createElement('span', 'button-icon');
    iconWrapper.dataset.icon = icon;
    button.append(iconWrapper);
  }

  if (type === 'reset') button.classList.add('secondary');
  return button;
}

/**
 * Toggles visibility of conditional fields based on the selected input
 * @param {Event} e - Change event
 * @param {Map} controllerConfig - Map of controller names to controlled fields
 */
function toggleConditional(e, controllerConfig) {
  const { target } = e;
  const controller = target.name;
  if (controllerConfig.has(controller)) {
    const inputs = [...controllerConfig.get(controller)];
    inputs.forEach((i) => {
      const field = i.closest('.form-field');
      const { condition } = field.dataset;
      const conditionMet = condition.includes(toClassName(target.value));
      field.setAttribute('aria-hidden', !conditionMet);

      if (conditionMet) {
        if (i.dataset.originalRequired === 'true') {
          i.setAttribute('required', '');
        }
        i.removeAttribute('tabindex');
      } else {
        i.removeAttribute('required');
        i.setAttribute('tabindex', '-1');
      }
    });
  }
}

/**
 * Sets initial visibility of conditional fields based on default values.
 * @param {HTMLFormElement} form - Form element
 * @param {Map} controllerConfig - Map of controller names to controlled fields.
 */
function initConditionals(form, controllerConfig) {
  controllerConfig.forEach((controlledInputs, controller) => {
    let controllerValue = null;
    const checked = form.querySelector(`[name="${controller}"]:checked`);
    const select = form.querySelector(`select[name="${controller}"]`);

    if (checked) {
      controllerValue = checked.value;
    } else if (select) {
      controllerValue = select.value;
    }

    if (controllerValue) {
      controlledInputs.forEach((input) => {
        const field = input.closest('.form-field');
        const { condition } = field.dataset;
        const conditionMet = condition.includes(toClassName(controllerValue));
        field.setAttribute('aria-hidden', !conditionMet);

        if (input.hasAttribute('required')) {
          if (!input.dataset.originalRequired) {
            input.dataset.originalRequired = 'true';
          }
          if (!conditionMet) {
            input.removeAttribute('required');
          }
        }
        if (conditionMet) {
          input.removeAttribute('tabindex');
        } else {
          input.setAttribute('tabindex', '-1');
        }
      });
    } else {
      controlledInputs.forEach((input) => {
        const field = input.closest('.form-field');
        field.setAttribute('aria-hidden', true);

        if (input.hasAttribute('required')) {
          if (!input.dataset.originalRequired) {
            input.dataset.originalRequired = 'true';
          }
          input.removeAttribute('required');
        }
        input.setAttribute('tabindex', '-1');
      });
    }
  });
}

/**
 * Sets up conditional field visibility and ARIA relationships
 * @param {HTMLFormElement} form - Form element
 */
function enableConditionals(form) {
  const controlled = [...form.querySelectorAll('[data-controller]')];
  const controllerConfig = new Map();

  controlled.forEach((c) => {
    const input = c.querySelector('input, textarea, select');
    const { controller } = c.dataset;

    if (!controllerConfig.has(controller)) controllerConfig.set(controller, []);
    controllerConfig.get(controller).push(input);

    if (input && input.id) {
      const controllerInputs = form.querySelectorAll(`[name="${controller}"]`);
      controllerInputs.forEach((controllerInput) => {
        const existingControls = controllerInput.getAttribute('aria-controls') || '';
        const controlsArray = existingControls.split(' ').filter((ec) => ec);

        if (!controlsArray.includes(input.id)) {
          controlsArray.push(input.id);
        }

        controllerInput.setAttribute('aria-controls', controlsArray.join(' '));
        input.setAttribute('aria-controlledby', controllerInput.id);
      });
    }
  });

  initConditionals(form, controllerConfig);

  form.addEventListener('change', (e) => {
    toggleConditional(e, controllerConfig);
  });
}

/**
 * Enables or disables all form elements
 * @param {HTMLFormElement} form - Form element
 * @param {boolean} [disabled=true] - Whether to disable the form
 */
function toggleForm(form, disabled = true) {
  [...form.elements].forEach((el) => {
    el.disabled = disabled;
  });
}

/**
 * Generates form submission payload from form elements
 * @param {HTMLFormElement} form - Form element
 * @returns {Object} Payload object with form data
 */
function generatePayload(form) {
  const payload = {};
  [...form.elements].forEach((field) => {
    if (field.name && !field.disabled) {
      if (field.type === 'radio') {
        if (field.checked) payload[field.name] = field.value;
      } else if (field.type === 'checkbox') {
        if (field.checked) payload[field.name] = payload[field.name] ? `${payload[field.name]},${field.value}` : field.value;
      } else {
        payload[field.name] = field.value;
      }
    }
  });
  return payload;
}

/**
 * Handles form submission
 * @param {HTMLFormElement} form - Form element to submit
 * @returns {Promise<void>}
 */
async function handleSubmit(form) {
  try {
    const payload = generatePayload(form);
    toggleForm(form);
    const response = await fetch(form.dataset.action, {
      method: 'POST',
      body: JSON.stringify({ data: payload }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (response.ok) {
      if (form.dataset.confirmation) {
        window.location.href = form.dataset.confirmation;
      }
    } else {
      const error = await response.text();
      throw new Error(error);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  } finally {
    toggleForm(form, false);
  }
}

/**
 * Sets up the standard (HTML5-validity based) form submission handler
 * @param {HTMLFormElement} form - Form element
 * @param {string} submit - Submit URL
 * @param {Array<Object>} fields - Array of field configurations
 */
function enableSubmission(form, submit, fields) {
  form.dataset.action = submit;
  const confirmation = fields.find((f) => f.type === 'confirmation');
  if (confirmation) {
    form.dataset.confirmation = confirmation.label || confirmation.default;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const valid = form.reportValidity();
    if (valid) {
      handleSubmit(form);
    } else {
      const firstInvalid = form.querySelector(':invalid:not(fieldset)');
      if (firstInvalid) {
        firstInvalid.focus();
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalid.setAttribute('aria-invalid', true);
      }
    }
  });

  form.addEventListener('input', (e) => {
    if (e.target.hasAttribute('aria-invalid')) {
      if (e.target.validity.valid) {
        e.target.removeAttribute('aria-invalid');
      }
    }
  });
}

/**
 * Creates a form field based on field configuration, including the authored
 * validation-message metadata used by this form's skin
 * @param {Object} field - Field configuration object
 * @returns {HTMLElement} Form field element (fieldset, div, or button)
 */
function buildField(field) {
  const {
    type, label, help, field: fieldName, conditional, validationMessage,
  } = field;
  const controlled = conditional || null;

  if (type === 'submit' || type === 'reset') return buildButton(field);

  if (type === 'radio' || type === 'checkbox') {
    const fieldset = buildOptions(field, controlled);
    if (help) fieldset.append(writeHelpText(help, generateId(fieldName)));
    return fieldset;
  }

  if (type === 'toggle') {
    const toggle = buildToggle(field, controlled);
    if (help) toggle.append(writeHelpText(help, generateId(fieldName)));
    return toggle;
  }

  if (type === 'select') {
    const select = buildSelect(field, controlled);
    if (help) select.append(writeHelpText(help, generateId(fieldName)));
    return select;
  }

  const wrapper = createElement('div', `form-field ${type}-field`);
  if (controlled) {
    const controller = controlled.split('-')[0];
    wrapper.dataset.controller = controller;
    wrapper.dataset.condition = controlled;
  }

  const inputId = generateId(fieldName);
  wrapper.append(buildLabel(label, 'label', inputId, field.required === 'true'));

  let helpText;
  if (help) {
    helpText = writeHelpText(help, inputId);
    wrapper.append(helpText);
  }

  const input = type === 'textarea' ? buildTextArea(field) : buildInput(field);

  if (type === 'textarea') wrapper.append(input);
  else wrapper.insertBefore(input, wrapper.firstChild.nextSibling);

  if (validationMessage) wrapper.append(writeValidationMessage(validationMessage));

  if (help) input.setAttribute('aria-describedby', helpText.id);

  return wrapper;
}

/**
 * Creates a complete form from field configurations
 * @param {Array<Object>} fields - Array of field configurations
 * @param {string} submit - Submit URL
 * @returns {HTMLFormElement} Complete form element
 */
function buildForm(fields, submit) {
  const form = createElement('form');
  form.setAttribute('novalidate', '');

  const buttons = [];

  fields.forEach((field) => {
    if (field.type === 'submit' || field.type === 'reset') {
      buttons.push(field);
    } else if (field.type !== 'confirmation') {
      form.append(buildField(field));
    }
  });

  if (buttons.length) {
    const buttonWrapper = createElement('div', 'button-wrapper');
    buttons.forEach((button) => buttonWrapper.append(buildField(button)));
    form.append(buttonWrapper);
  }

  enableConditionals(form);
  if (submit) enableSubmission(form, submit, fields);

  return form;
}

/**
 * Fetches the authored field definitions and builds/attaches the form,
 * independent of form.js so its shared build pipeline stays untouched
 * @param {HTMLElement} block - Form block element
 * @returns {Promise<HTMLFormElement|null>}
 */
async function loadForm(block) {
  const [source, submit] = [...block.querySelectorAll('a[href]')].map((a) => a.href);
  if (!source) {
    // eslint-disable-next-line no-console
    console.error('Unable to create form without source');
    return null;
  }

  try {
    const resp = await fetch(new URL(source, window.location.origin));
    if (!resp.ok) throw new Error(`${resp.status}: ${resp.statusText}`);
    const { data } = await resp.json();
    if (!data) throw new Error(`No form fields at ${source}`);

    const form = buildForm(data, submit);
    block.replaceChildren(form);
    block.removeAttribute('style');
    return form;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Could not build form from', source, error);
    return null;
  }
}

/**
 * Initializes custom VBRD validations for the Request a Call Back form.
 * @param {HTMLFormElement} form - The form element to validate
 */
function initRequestCallBackValidations(form) {
  // --- Core Validation Logic ---
  const validateField = (input) => {
    const wrapper = input.closest('.form-field');
    if (!wrapper) return true;

    const val = input.value.trim();
    let isFieldValid = true;

    // 1. Mandatory Fields (Hardcoded per VBRD design mismatch)
    const mandatoryFields = ['fullname', 'mobilenumber', 'emailaddress', 'dob'];
    const isMandatory = input.required || mandatoryFields.includes(input.name);

    if (isMandatory && !val) {
      isFieldValid = false;
    }

    // 2. Authored Regex Check
    if (val && input.dataset.regex) {
      const regex = new RegExp(input.dataset.regex);
      if (!regex.test(val)) isFieldValid = false;
    }

    // 3. DOB Custom Age Validation (STRICT DD-MM-YYYY)
    const isDateField = wrapper.classList.contains('date-field');
    if (isDateField && val && input.type !== 'hidden') {
      const errorSpan = wrapper.querySelector('.error-message');
      
      // Strictly enforce DD-MM-YYYY format using regex
      const formatRegex = /^\d{2}-\d{2}-\d{4}$/;
      
      if (!formatRegex.test(val)) {
        // Triggers if they typed something incomplete or with slashes
        if (errorSpan) errorSpan.textContent = 'Invalid date format';
        isFieldValid = false;
      } else {
        // If format is exactly DD-MM-YYYY, split and check age
        const [day, month, year] = val.split('-');
        const dob = new Date(`${year}-${month}-${day}`); // JS needs YYYY-MM-DD to parse

        if (isNaN(dob.getTime())) {
          if (errorSpan) errorSpan.textContent = 'Invalid date';
          isFieldValid = false;
        } else {
          const age = Math.abs(new Date(Date.now() - dob.getTime()).getUTCFullYear() - 1970);

          if (age < 18) {
            if (errorSpan) errorSpan.textContent = 'Min entry age is 18 Years';
            isFieldValid = false;
          } else if (age > 65) {
            if (errorSpan) errorSpan.textContent = 'Max entry age is 65 years';
            isFieldValid = false;
          }
        }
      }
    }

    // Apply or remove the invalid class to trigger the CSS
    if (!isFieldValid) wrapper.classList.add('is-invalid');
    else wrapper.classList.remove('is-invalid');

    return isFieldValid;
  };

  // --- Real-Time Focus Out / Blur Validation ---
  form.addEventListener('blur', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
      validateField(e.target);
    }
  }, true); // 'true' forces capture phase

  // --- Real-Time Typing & Input Restrictions ---
  form.addEventListener('input', (e) => {
    const input = e.target;
    const wrapper = input.closest('.form-field');

    if (!wrapper) return;

    // Full Name formatting
    if (input.name === 'fullname') {
      if (/[^a-zA-Z\s.]/.test(input.value)) {
        wrapper.classList.add('is-invalid'); // Instant error for non-characters
        input.value = input.value.replace(/[^a-zA-Z\s.]/g, '');
        return; 
      }

      let val = input.value;
      if (val.startsWith(' ') || val.startsWith('.')) val = val.substring(1);
      val = val.replace(/\s{2,}/g, ' ');
      input.value = val;
    }

    // Mobile Number formatting
    if (input.type === 'tel') {
      if (/\D/.test(input.value)) {
        wrapper.classList.add('is-invalid'); // Instant error for letters
        input.value = input.value.replace(/\D/g, '');
        return;
      }
    }

    // Date formatting (Strict DD-MM-YYYY typing mask)
    if (wrapper.classList.contains('date-field') && input.type !== 'hidden') {
      let v = input.value.replace(/\D/g, ''); // Strip everything that isn't a number
      
      // Auto-insert hyphens as they type
      if (v.length > 2) v = `${v.substring(0, 2)}-${v.substring(2)}`;
      if (v.length > 5) v = `${v.substring(0, 5)}-${v.substring(5)}`;
      
      input.value = v.substring(0, 10); // Enforce exactly 10 characters
    }

    wrapper.classList.remove('is-invalid');
  });

  // --- Submit Interceptor ---
  form.addEventListener('submit', (e) => {
    let isFormValid = true;

    form.querySelectorAll('.form-field input, .form-field select')
      .forEach((input) => {
      // Skip the hidden flatpickr input, only validate visible ones
        if (input.type === 'hidden' && input.classList.contains('flatpickr-input')) return;
        if (!validateField(input)) isFormValid = false;
      });

    if (!isFormValid) {
      e.preventDefault();
      e.stopImmediatePropagation(); 

      const firstInvalid = form.querySelector('.is-invalid input, .is-invalid select');
      if (firstInvalid) {
        firstInvalid.focus();
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, true);
}

/**
 * Builds the Request a Call Back form with its own independent build/load
 * pipeline (so form.js' shared functions stay untouched for other blocks),
 * then wires up the Flatpickr date picker and the custom VBRD validations.
 * @param {HTMLElement} block - The form block element
 */
export default async function decorateRequestCallBack(block) {
  const form = await loadForm(block);
  if (!form) return;

  form.querySelectorAll('.date-field input').forEach((input) => initDatePicker(input));
  initRequestCallBackValidations(form);
}
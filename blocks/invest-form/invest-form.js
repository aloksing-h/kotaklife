import { loadForm } from '../form/form.js';

const NAME_MAX_LENGTH = 47;
const EMAIL_MAX_LENGTH = 30;
const MOBILE_LENGTH = 10;
const MIN_AGE = 18;
const MAX_AGE = 65;
const LEAD_SUBMIT_URL = 'https://apigw-uat.mykotaklife.com/kli-customer-onboarding/api/v1/IntRestServices/LeadSquare.svc/LeadSquare';

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
 * Formats a JS Date as yyyy-mm-dd for use with a native date input
 * @param {Date} date
 * @returns {string}
 */
function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Computes completed age (in years) for a given yyyy-mm-dd DOB string
 * @param {string} dobValue
 * @returns {number}
 */
function calculateAge(dobValue) {
  const dob = new Date(dobValue);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

/**
 * Splits a full name into firstName/lastName following backend transformation rules:
 * single word -> lastName is '.', two words -> word2 is lastName,
 * three+ words -> first word is firstName, remaining words joined as lastName
 * @param {string} fullName
 * @returns {{firstName: string, lastName: string}}
 */
function splitNameForBackend(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] || '', lastName: '.' };
  if (parts.length === 2) return { firstName: parts[0], lastName: parts[1] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/**
 * Sanitizes free-typed name input: strips disallowed characters, leading
 * spaces/dots, collapses consecutive spaces, and enforces max length.
 * @param {string} raw
 * @returns {string}
 */
function sanitizeName(raw) {
  let value = raw.replace(/[^A-Za-z. ]/g, '');
  value = value.replace(/^[\s.]+/, '');
  value = value.replace(/ {2,}/g, ' ');
  return value.slice(0, NAME_MAX_LENGTH);
}

/**
 * Validates a (already sanitized/trimmed) name value
 * @param {string} value
 * @returns {string} error message, or empty string if valid
 */
function validateName(value) {
  const trimmed = value.trim();
  if (!trimmed) return 'Please enter valid name';
  if (!/^[A-Za-z][A-Za-z. ]{0,46}$/.test(trimmed)) return 'Please enter valid name';
  return '';
}

/**
 * Sanitizes free-typed email input: strips whitespace and enforces max length
 * @param {string} raw
 * @returns {string}
 */
function sanitizeEmail(raw) {
  return raw.replace(/\s/g, '').slice(0, EMAIL_MAX_LENGTH);
}

/**
 * Validates an email value
 * @param {string} value
 * @returns {string} error message, or empty string if valid
 */
function validateEmail(value) {
  const trimmed = value.trim();
  if (!trimmed) return 'Please enter valid email';
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) return 'Please enter valid email';
  return '';
}

/**
 * Sanitizes free-typed mobile input: digits only, enforces max length
 * @param {string} raw
 * @returns {string}
 */
function sanitizeMobile(raw) {
  return raw.replace(/\D/g, '').replace(/^[0-5]+/, '').slice(0, MOBILE_LENGTH);
}

/**
 * Validates a mobile number value
 * @param {string} value
 * @returns {string} error message, or empty string if valid
 */
function validateMobile(value) {
  if (!value || value.length < MOBILE_LENGTH) return 'Please enter valid mobile number';
  if (!/^[6-9]\d{9}$/.test(value)) return 'Please enter valid mobile number';
  return '';
}

/**
 * Validates a date of birth value against the min/max entry age rules
 * @param {string} value - yyyy-mm-dd
 * @returns {string} error message, or empty string if valid
 */
function validateDob(value) {
  if (!value) return 'Please enter valid date of birth';
  const age = calculateAge(value);
  if (age < MIN_AGE) return 'Min entry age is 18 Years';
  if (age > MAX_AGE) return 'Max entry age is 65 years';
  return '';
}

/**
 * Validates the consent checkbox
 * @param {boolean} checked
 * @returns {string} error message, or empty string if valid
 */
function validateConsent(checked) {
  return checked ? '' : 'Please accept the consent to proceed';
}

/**
 * Displays or clears a validation error message under a field
 * @param {HTMLElement} wrapper - field wrapper element
 * @param {HTMLElement} input - the input/select element being validated
 * @param {string} message - error message, empty string clears the error
 */
function setFieldError(wrapper, input, message) {
  if (!wrapper || !input) return;
  let error = wrapper.querySelector('.field-error');
  if (message) {
    if (!error) {
      error = createElement('p', 'field-error');
      wrapper.append(error);
    }
    error.textContent = message;
    input.setAttribute('aria-invalid', 'true');
  } else if (error) {
    error.remove();
    input.removeAttribute('aria-invalid');
  }
}

/**
 * Refreshes the date-of-birth input's min/max attributes to the valid age range
 * @param {HTMLInputElement} input
 */
function applyDobRange(input) {
  const today = new Date();
  const maxDob = new Date(today);
  maxDob.setFullYear(today.getFullYear() - MIN_AGE);
  const minDob = new Date(today);
  minDob.setFullYear(today.getFullYear() - MAX_AGE);
  input.max = toISODate(maxDob);
  input.min = toISODate(minDob);
}

/**
 * Sets an attribute only when the authored markup doesn't already define it
 * @param {HTMLElement} el
 * @param {string} attr
 * @param {string} value
 */
function ensureAttr(el, attr, value) {
  if (el && !el.hasAttribute(attr)) el.setAttribute(attr, value);
}

let flatpickrPromise;

/**
 * Loads the bundled Flatpickr assets once
 * @returns {Promise<Function>}
 */
function loadFlatpickr() {
  if (typeof window.flatpickr === 'function') return Promise.resolve(window.flatpickr);
  if (flatpickrPromise) return flatpickrPromise;

  const basePath = window.hlx?.codeBasePath || '';
  flatpickrPromise = new Promise((resolve, reject) => {
    const stylesheetId = 'flatpickr-styles';
    if (!document.getElementById(stylesheetId)) {
      const stylesheet = document.createElement('link');
      stylesheet.id = stylesheetId;
      stylesheet.rel = 'stylesheet';
      stylesheet.href = `${basePath}/styles/flatpickr.min.css`;
      document.head.append(stylesheet);
    }

    const script = document.createElement('script');
    script.src = `${basePath}/scripts/flatpickr.min.js`;
    script.onload = () => {
      if (typeof window.flatpickr === 'function') resolve(window.flatpickr);
      else reject(new Error('Flatpickr did not load'));
    };
    script.onerror = () => reject(new Error('Unable to load Flatpickr'));
    document.head.append(script);
  });

  return flatpickrPromise;
}

/**
 * Initializes Flatpickr on the authored date input
 * @param {HTMLInputElement} input
 * @returns {Promise<void>}
 */
async function initializeDatePicker(input) {
  try {
    const flatpickr = await loadFlatpickr();
    const dateFieldWrapper = input.closest('.date-field');

    const instance = flatpickr(input, {
      dateFormat: 'Y-m-d',
      altInput: true,
      altFormat: 'd-m-Y',
      locale: {
        firstDayOfWeek: 1,
        weekdays: {
          shorthand: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
          longhand: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        },
      },
      minDate: input.min,
      maxDate: input.max,
      disableMobile: true,
      allowInput: false,
      static: true,
      appendTo: dateFieldWrapper,
      onChange: () => {
        input.dispatchEvent(new Event('input', { bubbles: true }));
      },
    });

    const currentMonthElement = instance.calendarContainer.querySelector('.flatpickr-current-month');
    if (!currentMonthElement) return;

    // Build Custom Month Dropdown Select
    const monthSelect = document.createElement('select');
    monthSelect.className = 'custom-header-select custom-month-select';
    monthSelect.setAttribute('aria-label', 'Month');
    instance.l10n.months.longhand.forEach((month, monthIndex) => {
      const option = document.createElement('option');
      option.value = String(monthIndex);
      option.textContent = month;
      monthSelect.append(option);
    });

    // Build Custom Year Dropdown Select
    const yearSelect = document.createElement('select');
    yearSelect.className = 'custom-header-select custom-year-select';
    yearSelect.setAttribute('aria-label', 'Year');
    const startYear = instance.config.minDate
      ? instance.config.minDate.getFullYear() : new Date(input.min).getFullYear();
    const endYear = instance.config.maxDate
      ? instance.config.maxDate.getFullYear() : new Date(input.max).getFullYear();
    for (let year = endYear; year >= startYear; year -= 1) {
      const option = document.createElement('option');
      option.value = String(year);
      option.textContent = String(year);
      yearSelect.append(option);
    }

    // Month & Year Change Events
    monthSelect.addEventListener('change', (event) => {
      event.stopPropagation();
      const targetMonth = Number(event.target.value);
      instance.changeMonth(targetMonth - instance.currentMonth, false);
    });

    yearSelect.addEventListener('change', (event) => {
      event.stopPropagation();
      instance.changeYear(Number(event.target.value));
    });

    const updateHeaderDropdowns = () => {
      monthSelect.value = String(instance.currentMonth);
      yearSelect.value = String(instance.currentYear);
    };

    instance.config.onMonthChange.push(updateHeaderDropdowns);
    instance.config.onYearChange.push(updateHeaderDropdowns);

    currentMonthElement.querySelector('.flatpickr-monthDropdown-months')?.remove();
    currentMonthElement.querySelector('.numInputWrapper')?.remove();
    currentMonthElement.append(monthSelect, yearSelect);
    updateHeaderDropdowns();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[invest-form] date picker failed to load', error);
  }
}

/**
 * Builds the LeadSquare attribute array from validated form values.
 * @param {Object} values
 * @returns {Array<Object>}
 */
function buildLeadPayload(values) {
  const attributes = {
    mx_Quote_ID: '01N2365809',
    Source: 'ulip_organic',
    mx_IP_Address: '',
    mx_utm_lp_url: 'https://www.kotaklife.com/life-insurance-plans/#/buy-e-invest-ulip-plan-online?utm_source=ulip_organic&utm_medium=website&utm_campaign=top_menu&utm_term=%2F',
    mx_utm_campaign: 'top_menu',
    mx_UTM_Keyword: '',
    mx_utm_gclid: '',
    mx_utm_devicemodel: 'desktop-Chrome-Windows',
    mx_Product_Code: 'U04',
    mx_Product_Name: 'Kotak e-Invest Plus',
    mx_Plan_Option: 'Maximizer',
    mx_Last_Page_Filled: 'personal',
    mx_Last_Online_Date: '2025-08-28 12:37:20',
    mx_utm_ad_group: '',
    mx_Investment_Amount: '5000',
    mx_Investing_For: 'wealth creation',
    mx_Fund_Strategy: 'Age Based Strategy',
    mx_Classic_Opportunities: '70',
    mx_Frontline_Equity: '0',
    mx_Balanced: '0',
    mx_Dynamic_Bond: '30',
    mx_Dynamic_Guilt: '0',
    mx_Money_Market: '0',
    mx_Dynamic_floating_Rate: '0',
    Phone: values.mobile,
    FirstName: values.firstName,
    LastName: values.lastName,
    mx_Pincode: '',
    mx_Nominee_Full_Name: '',
    mx_Nominee_Relation: '',
    mx_Nominee_DOB: '',
    mx_Nominee_Percentage: '',
    mx_Appointee: '',
    mx_Appointee_Full_Name: '',
    mx_Appointee_Relation: '',
    mx_Appointee_DOB: '',
    mx_Gender: 'Male',
    mx_DOB: values.dob,
    mx_lead_source_1: 'ulip_organic',
    EmailAddress: values.email,
    mx_Proposal_Number: '79299669',
    mx_Risk_Apetite: 'Aggressive',
    mx_Policy_Term: '20',
    mx_ppt: '20',
    SourceMedium: 'website',
    SourceContent: '',
    mx_Aadhar_PAN_linking_status: '',
    mx_Income_Ranges: '5-7 Lakhs',
    mx_Kotak_Midcap_Advantage_Fund: '0',
    mx_Everify: 'No',
    mx_Future_Payment_Method: '',
    mx_call_recommendation: 'High',
    mx_media_risk_leve: 'Green',
    mx_trans_id: '1756363371348',
    mx_Keyword: '',
    mx_Kotak_Nifty_500_Multicap_Momentum_Quality_50_Index: '0',
    mx_Premium_Mode: 'Monthly',
  };
  return Object.entries(attributes).map(([Attribute, Value]) => ({ Value, Attribute }));
}

/**
 * Posts lead attributes to the configured submission endpoint.
 * @param {string} submitUrl
 * @param {Array<Object>} payload
 * @returns {Promise<{success: boolean, dummy: boolean, data?: Object}>}
 */
async function submitLead(submitUrl, payload) {
  const dummyResponse = {
    success: true,
    dummy: true,
    data: {
      statusCode: 200,
      message: {
        Status: 'Success',
        Message: {
          AffectedRows: 1,
        },
      },
    },
  };
  if (!submitUrl) {
    return dummyResponse;
  }
  try {
    const response = await fetch(submitUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
        Source: 'EinsuranceD2C',
        correlationId: '61817',
      },
    });
    const data = await response.json().catch(() => null);
    return { success: response.ok, dummy: false, data };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[invest-form] API unavailable; showing dummy response', error);
    return dummyResponse;
  }
}

/**
 * Loads the authored form, then wires up validation and submission
 * @param {Element} block The invest-form block element
 */
export default async function decorate(block) {
  const form = await loadForm(block);
  if (!form) return;

  const nameInput = form.querySelector('.text-field input');
  const emailInput = form.querySelector('.email-field input');
  const mobileInput = form.querySelector('.tel-field input');
  const dobInput = form.querySelector('.date-field input');
  const consentInput = form.querySelector('[name="consent"]');
  const submitButton = form.querySelector('button[type="submit"]');

  if (!nameInput || !mobileInput || !emailInput || !dobInput || !consentInput || !submitButton) {
    return;
  }

  ensureAttr(nameInput, 'placeholder', 'Enter your full name');
  ensureAttr(nameInput, 'maxlength', String(NAME_MAX_LENGTH));
  ensureAttr(nameInput, 'required', '');
  ensureAttr(mobileInput, 'placeholder', 'Enter mobile number');
  ensureAttr(mobileInput, 'maxlength', String(MOBILE_LENGTH));
  ensureAttr(mobileInput, 'required', '');
  ensureAttr(emailInput, 'placeholder', 'Enter email address');
  ensureAttr(emailInput, 'maxlength', String(EMAIL_MAX_LENGTH));
  ensureAttr(emailInput, 'required', '');
  ensureAttr(dobInput, 'required', '');
  ensureAttr(consentInput, 'required', '');

  applyDobRange(dobInput);
  initializeDatePicker(dobInput);

  const nameWrapper = nameInput.closest('.form-field');
  const mobileWrapper = mobileInput.closest('.form-field');
  const emailWrapper = emailInput.closest('.form-field');
  const dobWrapper = dobInput.closest('.form-field');
  const consentWrapper = consentInput.closest('.checkbox-field');

  submitButton.disabled = true;

  nameInput.addEventListener('input', () => {
    const { selectionStart } = nameInput;
    const before = nameInput.value;
    const sanitized = sanitizeName(before);
    if (sanitized !== before) {
      nameInput.value = sanitized;
      const diff = before.length - sanitized.length;
      const pos = Math.max(0, (selectionStart || sanitized.length) - diff);
      nameInput.setSelectionRange(pos, pos);
    }
    setFieldError(nameWrapper, nameInput, validateName(sanitized));
  });

  mobileInput.addEventListener('input', () => {
    const sanitized = sanitizeMobile(mobileInput.value);
    if (sanitized !== mobileInput.value) mobileInput.value = sanitized;
    setFieldError(mobileWrapper, mobileInput, validateMobile(sanitized));
  });

  emailInput.addEventListener('input', () => {
    const sanitized = sanitizeEmail(emailInput.value);
    if (sanitized !== emailInput.value) emailInput.value = sanitized;
    setFieldError(emailWrapper, emailInput, validateEmail(sanitized));
  });

  emailInput.addEventListener('beforeinput', (event) => {
    if (event.data && /\s/.test(event.data)) event.preventDefault();
  });

  dobInput.addEventListener('input', () => {
    setFieldError(dobWrapper, dobInput, validateDob(dobInput.value));
  });

  consentInput.addEventListener('change', () => {
    const { checked } = consentInput;
    setFieldError(consentWrapper, consentInput, validateConsent(checked));
  });

  const validators = [
    () => {
      nameInput.value = nameInput.value.trimEnd();
      const error = validateName(nameInput.value);
      setFieldError(nameWrapper, nameInput, error);
      return !error;
    },
    () => {
      const error = validateMobile(mobileInput.value);
      setFieldError(mobileWrapper, mobileInput, error);
      return !error;
    },
    () => {
      const error = validateEmail(emailInput.value);
      setFieldError(emailWrapper, emailInput, error);
      return !error;
    },
    () => {
      const error = validateDob(dobInput.value);
      setFieldError(dobWrapper, dobInput, error);
      return !error;
    },
    () => {
      const error = validateConsent(consentInput.checked);
      setFieldError(consentWrapper, consentInput, error);
      return !error;
    },
  ];

  const refreshSubmitState = () => {
    const fieldsAreValid = !validateName(nameInput.value)
      && !validateMobile(mobileInput.value)
      && !validateEmail(emailInput.value)
      && !validateDob(dobInput.value)
      && !validateConsent(consentInput.checked);
    submitButton.disabled = !fieldsAreValid;
  };

  form.addEventListener('input', refreshSubmitState);
  form.addEventListener('change', refreshSubmitState);
  refreshSubmitState();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const results = validators.map((validate) => validate());
    if (results.includes(false)) {
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const { firstName, lastName } = splitNameForBackend(nameInput.value.trim());
    const payload = buildLeadPayload({
      firstName,
      lastName,
      mobile: mobileInput.value,
      email: emailInput.value.trim(),
      dob: dobInput.value,
    });

    submitButton.disabled = true;
    const result = await submitLead(LEAD_SUBMIT_URL, payload);
    const { success, dummy } = result;
    // eslint-disable-next-line no-console
    console.log(dummy ? '[invest-form] Dummy response:' : '[invest-form] Response:', result.data);
    if (success) {
      form.replaceChildren();
      const successMessage = createElement('p', 'form-success-message');
      successMessage.setAttribute('role', 'status');
      successMessage.textContent = dummy
        ? 'Demo response: The service is unavailable. Your details have not been submitted.'
        : 'Thank you! Our expert will get in touch with you shortly.';
      form.append(successMessage);
    } else {
      refreshSubmitState();
    }
  });
}

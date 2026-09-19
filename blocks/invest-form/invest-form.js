// const NAME_MAX_LENGTH = 47;
// const EMAIL_MAX_LENGTH = 30;
// const MOBILE_LENGTH = 10;
// const MIN_AGE = 18;
// const MAX_AGE = 65;

// /**
//  * Creates an HTML element with an optional class name
//  * @param {string} tag - HTML tag name
//  * @param {string} [className] - Optional CSS class name
//  * @returns {HTMLElement} Created element
//  */
// function createElement(tag, className) {
//   const el = document.createElement(tag);
//   if (className) el.className = className;
//   return el;
// }

// /**
//  * Formats a JS Date as yyyy-mm-dd for use with a native date input
//  * @param {Date} date
//  * @returns {string}
//  */
// function toISODate(date) {
//   return date.toISOString().slice(0, 10);
// }

// /**
//  * Computes completed age (in years) for a given yyyy-mm-dd DOB string
//  * @param {string} dobValue
//  * @returns {number}
//  */
// function calculateAge(dobValue) {
//   const dob = new Date(dobValue);
//   const today = new Date();
//   let age = today.getFullYear() - dob.getFullYear();
//   const monthDiff = today.getMonth() - dob.getMonth();
//   if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
//     age -= 1;
//   }
//   return age;
// }

// /**
//  * Splits a full name into firstName/lastName following backend transformation rules:
//  * single word -> lastName is '.', two words -> word2 is lastName,
//  * three+ words -> first word is firstName, remaining words joined as lastName
//  * @param {string} fullName
//  * @returns {{firstName: string, lastName: string}}
//  */
// function splitNameForBackend(fullName) {
//   const parts = fullName.trim().split(/\s+/).filter(Boolean);
//   if (parts.length <= 1) return { firstName: parts[0] || '', lastName: '.' };
//   if (parts.length === 2) return { firstName: parts[0], lastName: parts[1] };
//   return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
// }

// /**
//  * Sanitizes free-typed name input: strips disallowed characters, leading
//  * spaces/dots, collapses consecutive spaces, and enforces max length.
//  * @param {string} raw
//  * @returns {string}
//  */
// function sanitizeName(raw) {
//   let value = raw.replace(/[^A-Za-z. ]/g, '');
//   value = value.replace(/^[\s.]+/, '');
//   value = value.replace(/ {2,}/g, ' ');
//   return value.slice(0, NAME_MAX_LENGTH);
// }

// /**
//  * Validates a (already sanitized/trimmed) name value
//  * @param {string} value
//  * @returns {string} error message, or empty string if valid
//  */
// function validateName(value) {
//   const trimmed = value.trim();
//   if (!trimmed) return 'Please enter valid name';
//   if (!/^[A-Za-z][A-Za-z. ]{0,46}$/.test(trimmed)) return 'Please enter valid name';
//   return '';
// }

// /**
//  * Sanitizes free-typed email input: strips whitespace and enforces max length
//  * @param {string} raw
//  * @returns {string}
//  */
// function sanitizeEmail(raw) {
//   return raw.replace(/\s/g, '').slice(0, EMAIL_MAX_LENGTH);
// }

// /**
//  * Validates an email value
//  * @param {string} value
//  * @returns {string} error message, or empty string if valid
//  */
// function validateEmail(value) {
//   const trimmed = value.trim();
//   if (!trimmed) return 'Please enter valid email';
//   if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Please enter valid email';
//   return '';
// }

// /**
//  * Sanitizes free-typed mobile input: digits only, enforces max length
//  * @param {string} raw
//  * @returns {string}
//  */
// function sanitizeMobile(raw) {
//   return raw.replace(/\D/g, '').slice(0, MOBILE_LENGTH);
// }

// /**
//  * Validates a mobile number value
//  * @param {string} value
//  * @returns {string} error message, or empty string if valid
//  */
// function validateMobile(value) {
//   if (!value || value.length < MOBILE_LENGTH) return 'Please enter valid mobile number';
//   if (!/^[6-9]\d{9}$/.test(value)) return 'Please enter valid mobile number';
//   return '';
// }

// /**
//  * Validates a date of birth value against the min/max entry age rules
//  * @param {string} value - yyyy-mm-dd
//  * @returns {string} error message, or empty string if valid
//  */
// function validateDob(value) {
//   if (!value) return 'Please enter valid date of birth';
//   const age = calculateAge(value);
//   if (age < MIN_AGE) return 'Min entry age is 18 Years';
//   if (age > MAX_AGE) return 'Max entry age is 65 years';
//   return '';
// }

// /**
//  * Validates the consent checkbox
//  * @param {boolean} checked
//  * @returns {string} error message, or empty string if valid
//  */
// function validateConsent(checked) {
//   return checked ? '' : 'Please accept the consent to proceed';
// }

// /**
//  * Displays or clears a validation error message under a field
//  * @param {HTMLElement} wrapper - field wrapper element
//  * @param {HTMLElement} input - the input/select element being validated
//  * @param {string} message - error message, empty string clears the error
//  */
// function setFieldError(wrapper, input, message) {
//   if (!wrapper || !input) return;
//   let error = wrapper.querySelector('.field-error');
//   if (message) {
//     if (!error) {
//       error = createElement('p', 'field-error');
//       wrapper.append(error);
//     }
//     error.textContent = message;
//     input.setAttribute('aria-invalid', 'true');
//   } else if (error) {
//     error.remove();
//     input.removeAttribute('aria-invalid');
//   }
// }

// /**
//  * Refreshes the date-of-birth input's min/max attributes to the valid age range
//  * @param {HTMLInputElement} input
//  */
// function applyDobRange(input) {
//   const today = new Date();
//   const maxDob = new Date(today);
//   maxDob.setFullYear(today.getFullYear() - MIN_AGE);
//   const minDob = new Date(today);
//   minDob.setFullYear(today.getFullYear() - MAX_AGE);
//   input.max = toISODate(maxDob);
//   input.min = toISODate(minDob);
// }

// /**
//  * Builds the invest-form markup (name, mobile, email, dob, consent, submit)
//  * so the elements are guaranteed to exist before validation is wired up.
//  * @returns {HTMLFormElement}
//  */
// function buildForm() {
//   const form = createElement('form', 'form');
//   form.setAttribute('novalidate', '');

//   const nameWrapper = createElement('div', 'form-field');
//   nameWrapper.innerHTML = '<label for="fullname">Full Name</label>'
//     + `<input type="text" id="fullname" name="fullname" required placeholder="Enter your full name" maxlength="${NAME_MAX_LENGTH}">`;

//   const mobileWrapper = createElement('div', 'form-field');
//   mobileWrapper.innerHTML = '<label for="mobile">Mobile Number</label>'
//     + `<input type="tel" id="mobile" name="mobile" required placeholder="Enter mobile number" maxlength="${MOBILE_LENGTH}">`;

//   const emailWrapper = createElement('div', 'form-field');
//   emailWrapper.innerHTML = '<label for="email">Email Address</label>'
//     + `<input type="email" id="email" name="email" required placeholder="Enter email address" maxlength="${EMAIL_MAX_LENGTH}">`;

//   const dobWrapper = createElement('div', 'form-field date-field');
//   dobWrapper.innerHTML = '<label for="dob">Date of Birth</label>'
//     + '<input type="date" id="dob" name="dob" required>';

//   const submitWrapper = createElement('div', 'button-wrapper');
//   submitWrapper.innerHTML = '<button class="button" type="submit" disabled>'
//     + '<span>Talk to an Expert</span><span class="button-icon"></span></button>';

//   const consentWrapper = createElement('fieldset', 'checkbox-field');
//   consentWrapper.innerHTML = '<label for="consent"><input type="checkbox" id="consent" name="consent" required>'
//     + '<span></span>I agree to be contacted by Kotak Life regarding this enquiry.</label>';

//   form.append(nameWrapper, mobileWrapper, emailWrapper, dobWrapper, submitWrapper, consentWrapper);
//   return form;
// }

// /**
//  * Simulates a lead submission call. Posts to the authored form URL if present,
//  * otherwise falls back to a dummy resolved response for FE-only testing.
//  * @param {string} submitUrl
//  * @param {Object} payload
//  * @returns {Promise<boolean>}
//  */
// async function submitLead(submitUrl, payload) {
//   if (!submitUrl) {
//     // eslint-disable-next-line no-console
//     console.log('[invest-form] Dummy API submission', payload);
//     return new Promise((resolve) => {
//       setTimeout(() => resolve(true), 500);
//     });
//   }
//   try {
//     const response = await fetch(submitUrl, {
//       method: 'POST',
//       body: JSON.stringify({ data: payload }),
//       headers: { 'Content-Type': 'application/json' },
//     });
//     return response.ok;
//   } catch (error) {
//     // eslint-disable-next-line no-console
//     console.error('[invest-form] submission failed', error);
//     return false;
//   }
// }

// /**
//  * Builds the form, appends it to the block, then wires up validation and submission
//  * @param {Element} block The invest-form block element
//  */
// export default function decorate(block) {
//   const submitUrl = block.querySelector('a[href]')?.href || '';

//   const form = buildForm();
//   block.replaceChildren(form);

//   const nameInput = form.querySelector('[name="fullname"]');
//   const mobileInput = form.querySelector('[name="mobile"]');
//   const emailInput = form.querySelector('[name="email"]');
//   const dobInput = form.querySelector('[name="dob"]');
//   const consentInput = form.querySelector('[name="consent"]');
//   const submitButton = form.querySelector('button[type="submit"]');

//   if (!nameInput || !mobileInput || !emailInput || !dobInput || !consentInput || !submitButton) {
//     return;
//   }

//   applyDobRange(dobInput);

//   const nameWrapper = nameInput.closest('.form-field');
//   const mobileWrapper = mobileInput.closest('.form-field');
//   const emailWrapper = emailInput.closest('.form-field');
//   const dobWrapper = dobInput.closest('.form-field');
//   const consentWrapper = consentInput.closest('.checkbox-field');

//   submitButton.disabled = true;

//   nameInput.addEventListener('input', () => {
//     const { selectionStart } = nameInput;
//     const before = nameInput.value;
//     const sanitized = sanitizeName(before);
//     if (sanitized !== before) {
//       nameInput.value = sanitized;
//       const diff = before.length - sanitized.length;
//       const pos = Math.max(0, (selectionStart || sanitized.length) - diff);
//       nameInput.setSelectionRange(pos, pos);
//     }
//     setFieldError(nameWrapper, nameInput, validateName(sanitized));
//   });

//   mobileInput.addEventListener('input', () => {
//     const sanitized = sanitizeMobile(mobileInput.value);
//     if (sanitized !== mobileInput.value) mobileInput.value = sanitized;
//     setFieldError(mobileWrapper, mobileInput, validateMobile(sanitized));
//   });

//   emailInput.addEventListener('input', () => {
//     const sanitized = sanitizeEmail(emailInput.value);
//     if (sanitized !== emailInput.value) emailInput.value = sanitized;
//     setFieldError(emailWrapper, emailInput, validateEmail(sanitized));
//   });

//   dobInput.addEventListener('input', () => {
//     setFieldError(dobWrapper, dobInput, validateDob(dobInput.value));
//   });

//   dobInput.addEventListener('click', () => {
//   if (typeof dobInput.showPicker === 'function') {
//     dobInput.showPicker();
//   }
// });

//   consentInput.addEventListener('change', () => {
//     const { checked } = consentInput;
//     setFieldError(consentWrapper, consentInput, validateConsent(checked));
//   });

//   const validators = [
//     () => {
//       nameInput.value = nameInput.value.trimEnd();
//       const error = validateName(nameInput.value);
//       setFieldError(nameWrapper, nameInput, error);
//       return !error;
//     },
//     () => {
//       const error = validateMobile(mobileInput.value);
//       setFieldError(mobileWrapper, mobileInput, error);
//       return !error;
//     },
//     () => {
//       const error = validateEmail(emailInput.value);
//       setFieldError(emailWrapper, emailInput, error);
//       return !error;
//     },
//     () => {
//       const error = validateDob(dobInput.value);
//       setFieldError(dobWrapper, dobInput, error);
//       return !error;
//     },
//     () => {
//       const error = validateConsent(consentInput.checked);
//       setFieldError(consentWrapper, consentInput, error);
//       return !error;
//     },
//   ];

//   const refreshSubmitState = () => {
//     const isComplete = nameInput.value.trim()
//       && mobileInput.value.trim()
//       && emailInput.value.trim()
//       && dobInput.value.trim()
//       && consentInput.checked;
//     submitButton.disabled = !isComplete;
//   };

//   form.addEventListener('input', refreshSubmitState);
//   form.addEventListener('change', refreshSubmitState);
//   refreshSubmitState();

//   form.addEventListener('submit', async (event) => {
//     event.preventDefault();
//     const results = validators.map((validate) => validate());
//     if (results.includes(false)) {
//       const firstInvalid = form.querySelector('[aria-invalid="true"]');
//       if (firstInvalid) firstInvalid.focus();
//       return;
//     }

//     const { firstName, lastName } = splitNameForBackend(nameInput.value.trim());
//     const payload = {
//       firstName,
//       lastName,
//       mobile: mobileInput.value,
//       email: emailInput.value.trim(),
//       dob: dobInput.value,
//       consent: consentInput.checked,
//     };

//     submitButton.disabled = true;
//     const success = await submitLead(submitUrl, payload);
//     if (success) {
//       form.replaceChildren();
//       const successMessage = createElement('p', 'form-success-message');
//       successMessage.textContent = 'Thank you! Our expert will get in touch with you shortly.';
//       form.append(successMessage);
//     } else {
//       refreshSubmitState();
//     }
//   });
// }

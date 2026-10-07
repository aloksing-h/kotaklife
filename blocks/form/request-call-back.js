/**
 * Initializes custom VBRD validations for the Request a Call Back form.
 * @param {HTMLFormElement} form - The form element to validate
 */
export function initRequestCallBackValidations(form) {
  
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

    // 3. DOB Custom Age Validation
    const isDateField = wrapper.classList.contains('date-field');
    if (isDateField && val) {
      const dob = new Date(val);
      const age = Math.abs(new Date(Date.now() - dob.getTime()).getUTCFullYear() - 1970);
      const errorSpan = wrapper.querySelector('.error-message');
      
      if (age < 18) {
        if (errorSpan) errorSpan.textContent = "Min entry age is 18 Years";
        isFieldValid = false;
      } else if (age > 65) {
        if (errorSpan) errorSpan.textContent = "Max entry age is 65 years";
        isFieldValid = false;
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
    
    // Full Name formatting
    if (input.name === 'fullname') {
      let val = input.value;
      if (val.startsWith(' ') || val.startsWith('.')) val = val.substring(1);
      val = val.replace(/[^a-zA-Z\s.]/g, '').replace(/\s{2,}/g, ' ');
      input.value = val;
    }

    // Mobile Number formatting
    const wrapper = input.closest('.form-field');
    if (!wrapper) return;

    if (input.type === 'tel') {
      if (/\D/.test(input.value)) {
        wrapper.classList.add('is-invalid'); // Instant error for letters
        input.value = input.value.replace(/\D/g, ''); 
        return; 
      }
    }
    
    wrapper.classList.remove('is-invalid');
  });

  // --- Submit Interceptor ---
  // Using capture: true so this runs BEFORE the generic form.js submit logic
  form.addEventListener('submit', (e) => {
    let isFormValid = true;

    form.querySelectorAll('.form-field input, .form-field select').forEach(input => {
      // Skip the hidden flatpickr input, only validate visible ones
      if (input.type === 'hidden' && input.classList.contains('flatpickr-input')) return;
      if (!validateField(input)) isFormValid = false;
    });

    if (!isFormValid) {
      e.preventDefault();
      e.stopImmediatePropagation(); // Stops standard API submission in form.js

      const firstInvalid = form.querySelector('.is-invalid input, .is-invalid select');
      if (firstInvalid) {
        firstInvalid.focus();
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, true); 
}
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
 * Initializes Flatpickr (with custom month/year dropdowns) on a date input.
 * Honors the input's existing min/max attributes, if any, as the allowed range.
 * @param {HTMLInputElement} input
 * @returns {Promise<void>}
 */
export default async function initDatePicker(input) {
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
      minDate: input.min || undefined,
      maxDate: input.max || undefined,
      disableMobile: true,
      allowInput: false,
      static: true,
      appendTo: dateFieldWrapper,
      clickOpens: false,
      onChange: () => {
        input.dispatchEvent(new Event('input', { bubbles: true }));
      },
    });

    // clickOpens is disabled above so a
    // second click can close the calendar instead of re-opening it
    const toggleTarget = instance.altInput || input;
    toggleTarget.addEventListener('click', () => {
      if (instance.isOpen) instance.close();
      else instance.open();
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
      ? instance.config.minDate.getFullYear() : new Date().getFullYear() - 100;
    const endYear = instance.config.maxDate
      ? instance.config.maxDate.getFullYear() : new Date().getFullYear();
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
    console.error('[date-picker] failed to load', error);
  }
}

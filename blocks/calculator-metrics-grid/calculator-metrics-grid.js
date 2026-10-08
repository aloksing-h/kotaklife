export default function decorate(block) {
  block.innerHTML = `
    <section class="metrics-grid-surface" aria-label="FIRE result summary">
      <header class="metrics-grid-hero">
        <span class="metrics-grid-hero-icon" aria-hidden="true">
          <img src="/icons/fire-number-icons.svg" alt="fire-number-icons">
        </span>
        <div class="metrics-grid-hero-copy">
          <h2>Your F.I.R.E number</h2>
          <p class="metrics-grid-hero-value" data-metric="standard-fire-target" aria-live="polite">--</p>
          <p class="metrics-grid-hero-caption" data-metric="standard-fire-caption"></p>
        </div>
      </header>
      <div class="metrics-grid-divider" aria-hidden="true"></div>
      <h3 class="metrics-grid-title">FIRE snapshot</h3>
      <div class="metrics-grid-items">
        <div class="metrics-grid-item">
          <div class="metrics-grid-item-heading">
            <img src="/icons/amount-expenses-icon.svg" alt="amount-expenses-icon">
            <p class="metrics-grid-label">Amount expenses today</p>
          </div>
          <p class="metrics-grid-value" data-metric="yearly-expense-today">--</p>
        </div>
        <div class="metrics-grid-item">
          <div class="metrics-grid-item-heading">
            <img src="/icons/expense-age-icon.svg" alt="expense-age-icon">
            <p class="metrics-grid-label" data-metric="retirement-expense-label">Expenses at retirement</p>
          </div>
          <p class="metrics-grid-value" data-metric="yearly-expense-at-retirement">--</p>
        </div>
        <div class="metrics-grid-item">
          <div class="metrics-grid-item-heading">
            <img src="/icons/lean-fire-icon.svg" alt="lean-fire-icon">
            <p class="metrics-grid-label">Lean FIRE <span class="metrics-grid-info">i</span></p>
          </div>
          <p class="metrics-grid-value" data-metric="lean-fire-target">--</p>
        </div>
        <div class="metrics-grid-item">
          <div class="metrics-grid-item-heading">
            <img src="/icons/fat-fire-icon.svg" alt="fat-fire-icon">
            <p class="metrics-grid-label">FAT fire (50) <span class="metrics-grid-info">i</span></p>
          </div>
          <p class="metrics-grid-value" data-metric="fat-fire-target">--</p>
        </div>
      </div>
    </section>`;

  const formatCurrency = (value) => `₹ ${Math.round(value).toLocaleString('en-IN')}`;
  const metric = (name) => block.querySelector(`[data-metric="${name}"]`);

  function updateMetrics({ result, retireAge }) {
    if (!result?.isValid) {
      [
        'standard-fire-target',
        'yearly-expense-today',
        'yearly-expense-at-retirement',
        'lean-fire-target',
        'fat-fire-target',
      ].forEach((name) => { metric(name).textContent = '--'; });
      metric('standard-fire-caption').textContent = '';
      metric('retirement-expense-label').textContent = 'Expenses age';
      return;
    }

    metric('standard-fire-target').textContent = formatCurrency(result.standardFireTarget);
    metric('standard-fire-caption').textContent = `${(result.standardFireTarget / 10000000).toFixed(2)} crore`;
    metric('yearly-expense-today').textContent = formatCurrency(result.yearlyExpenseToday);
    metric('yearly-expense-at-retirement').textContent = formatCurrency(result.yearlyExpenseAtRetirement);
    metric('lean-fire-target').textContent = formatCurrency(result.leanFireTarget);
    metric('fat-fire-target').textContent = formatCurrency(result.fatFireTarget);
    metric('retirement-expense-label').textContent = `Expenses age (${retireAge})`;
  }

  const scope = block.closest('.fire-calculator') || block.closest('.section') || document;
  scope.addEventListener('fire-plan-update', (event) => updateMetrics(event.detail));
  if (scope.firePlanResult) {
    updateMetrics({ ...scope.firePlanInputs, result: scope.firePlanResult });
  }
}

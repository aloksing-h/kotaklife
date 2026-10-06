import { moveInstrumentation } from '../../scripts/scripts.js';
import { loadScript } from '../../scripts/aem.js';

const DEFAULTS = {
  resultLabel: 'You may get',
  summaryTemplate: 'If you invest {investmentAmount} {frequency} for {investmentYears} years at {rate}% p.a.',
  chartLabel: 'Your returns',
  ctaLabel: 'Invest Now',
};

const charts = new WeakMap();
let chartLibraryPromise;

function loadChartJs() {
  if (window.Chart) return Promise.resolve(window.Chart);
  if (!chartLibraryPromise) {
    chartLibraryPromise = loadScript(`${window.hlx.codeBasePath}/scripts/chart.js`)
      .then(() => {
        if (!window.Chart) throw new Error('Chart.js failed to initialize.');
        return window.Chart;
      })
      .catch((error) => {
        chartLibraryPromise = undefined;
        throw error;
      });
  }
  return chartLibraryPromise;
}

function formatCurrency(value) {
  const amount = Number(value);
  return `\u20B9 ${Math.round(Number.isFinite(amount) ? amount : 0).toLocaleString('en-IN')}`;
}

function getFrequencyLabel(frequency) {
  return {
    12: 'monthly',
    4: 'quarterly',
    2: 'every six months',
    1: 'yearly',
  }[frequency] || '';
}

export default function decorate(block) {
  const authoredRows = [...block.children];
  const readText = (index, fallback) => authoredRows[index]?.textContent.trim() || fallback;
  const link = authoredRows[4]?.querySelector('a');
  const ctaHref = link?.getAttribute('href')?.trim() || '';
  const resultLabel = readText(0, DEFAULTS.resultLabel);
  const summaryTemplate = readText(1, DEFAULTS.summaryTemplate);
  const chartLabel = readText(2, DEFAULTS.chartLabel);
  const ctaLabel = readText(3, DEFAULTS.ctaLabel);

  block.innerHTML = `
    <div class="result-card">
      <div class="result-total">
        <p class="result-label"></p>
        <p class="result-amount" aria-live="polite">--</p>
        <p class="investment-summary"></p>
      </div>
      <div class="result-chart">
        <div class="chart-legend">
          <span class="chart-legend-dot" aria-hidden="true"></span>
          <p class="chart-legend-label"></p>
        </div>
        <div class="chart-plot">
          <canvas class="chart-canvas" role="img"></canvas>
        </div>
      </div>
      <a class="result-cta"><span class="cta-label"></span></a>
    </div>`;

  const resultLabelElement = block.querySelector('.result-label');
  const summaryElement = block.querySelector('.investment-summary');
  const amountElement = block.querySelector('.result-amount');
  const chartLabelElement = block.querySelector('.chart-legend-label');
  const chartCanvas = block.querySelector('.chart-canvas');
  const cta = block.querySelector('.result-cta');

  resultLabelElement.textContent = resultLabel;
  chartLabelElement.textContent = chartLabel;
  cta.querySelector('.cta-label').textContent = ctaLabel;
  if (ctaHref) cta.href = ctaHref;
  else cta.setAttribute('aria-disabled', 'true');

  [resultLabelElement, summaryElement, chartLabelElement, cta.querySelector('.cta-label'), cta]
    .forEach((target, index) => {
      if (authoredRows[index]) moveInstrumentation(authoredRows[index], target);
    });

  async function updateLineChart(canvas, label, points) {
    const Chart = await loadChartJs();
    const existingChart = charts.get(canvas);
    const labels = points.map((point) => String(point.year));
    const values = points.map((point) => Number(point.balance));

    if (existingChart) {
      existingChart.data.labels = labels;
      existingChart.data.datasets[0].label = label;
      existingChart.data.datasets[0].data = values;
      existingChart.update('none');
      return;
    }

    const styles = getComputedStyle(block);
    const lineColor = styles.getPropertyValue('--brand-blue-600').trim();
    const gridColor = styles.getPropertyValue('--brand-blue-50').trim();
    const tickColor = styles.getPropertyValue('--gray-600').trim();
    const chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label,
          data: values,
          borderColor: lineColor,
          backgroundColor: lineColor,
          borderWidth: 3,
          cubicInterpolationMode: 'monotone',
          tension: 0.35,
          pointBackgroundColor: lineColor,
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${label}: ${formatCurrency(context.parsed.y)}`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: gridColor },
            border: { display: false },
            ticks: {
              autoSkip: true,
              maxRotation: 0,
              color: tickColor,
              font: { family: styles.fontFamily },
            },
          },
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            border: { display: false },
            ticks: {
              count: 5,
              color: tickColor,
              callback: (value) => Math.round(Number(value)).toLocaleString('en-IN'),
              font: { family: styles.fontFamily },
            },
          },
        },
      },
    });
    charts.set(canvas, chart);
  }

  let pendingChartUpdate;
  let chartIsVisible = !('IntersectionObserver' in window);
  let chartUpdateQueued = false;

  function flushChartUpdate() {
    chartUpdateQueued = false;
    if (!chartIsVisible || !pendingChartUpdate) return;

    const { canvas, label, points } = pendingChartUpdate;
    pendingChartUpdate = undefined;
    updateLineChart(canvas, label, points)
      .catch(() => chartCanvas.setAttribute('aria-label', chartLabel));
  }

  function scheduleChartUpdate(canvas, label, points) {
    pendingChartUpdate = { canvas, label, points };
    if (!chartIsVisible || chartUpdateQueued) return;

    chartUpdateQueued = true;
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(flushChartUpdate, { timeout: 1000 });
    } else {
      window.setTimeout(flushChartUpdate, 0);
    }
  }

  function updateSummary(inputs) {
    const values = {
      investmentAmount: formatCurrency(inputs.investmentAmount),
      frequency: getFrequencyLabel(Number(inputs.frequency)),
      investmentYears: inputs.investmentYears,
      holdingYears: inputs.holdingYears,
      rate: inputs.rate,
    };
    summaryElement.textContent = summaryTemplate.replace(/\{([a-zA-Z]+)\}/g, (match, key) => (
      Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match
    ));
  }

  function updateResult(inputs, result) {
    if (!inputs || !result) return;
    amountElement.textContent = formatCurrency(result.finalAmount);
    updateSummary(inputs);
    scheduleChartUpdate(chartCanvas, chartLabel, result.yearlyData);
  }

  const scope = block.closest('.compound-calculator') || block.closest('.section') || document;
  if ('IntersectionObserver' in window) {
    const chartObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      chartIsVisible = true;
      chartObserver.disconnect();
      if (pendingChartUpdate) {
        const { canvas, label, points } = pendingChartUpdate;
        scheduleChartUpdate(canvas, label, points);
      }
    });
    chartObserver.observe(chartCanvas);
  }

  scope.addEventListener('compound-plan-update', (event) => {
    updateResult(event.detail, event.detail);
  });
  updateResult(scope.compoundPlanInputs, scope.compoundPlanResult);
}

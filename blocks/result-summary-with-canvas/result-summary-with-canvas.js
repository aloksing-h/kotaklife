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

function formatAmount(value) {
  const amount = Number(value);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const absoluteAmount = Math.abs(safeAmount);
  if (absoluteAmount >= 10000000) {
    return `${(safeAmount / 10000000).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr`;
  }
  if (absoluteAmount >= 100000) {
    return `${(safeAmount / 100000).toLocaleString('en-IN', { maximumFractionDigits: 2 })} L`;
  }
  return Math.round(safeAmount).toLocaleString('en-IN');
}

function formatCurrency(value) {
  return `\u20B9 ${formatAmount(value)}`;
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
        <button class="chart-legend" type="button" aria-pressed="true">
          <span class="chart-legend-dot" aria-hidden="true"></span>
          <span class="chart-legend-label"></span>
        </button>
        <div class="chart-plot">
          <canvas class="chart-canvas" role="img"></canvas>
        </div>
      </div>
      <a class="result-cta"><span class="cta-label"></span></a>
    </div>`;

  const resultLabelElement = block.querySelector('.result-label');
  const summaryElement = block.querySelector('.investment-summary');
  const amountElement = block.querySelector('.result-amount');
  const chartLegend = block.querySelector('.chart-legend');
  const chartLabelElement = block.querySelector('.chart-legend-label');
  const chartCanvas = block.querySelector('.chart-canvas');
  const cta = block.querySelector('.result-cta');
  let returnsVisible = true;

  chartLegend.addEventListener('click', () => {
    returnsVisible = !returnsVisible;
    chartLegend.setAttribute('aria-pressed', String(returnsVisible));
    const chart = charts.get(chartCanvas);
    if (chart) {
      chart.setDatasetVisibility(0, returnsVisible);
      chart.update('none');
    }
  });

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
    const lineColor = styles.getPropertyValue('--info-800').trim();
    const gridColor = styles.getPropertyValue('--gray-400').trim();
    const baselineColor = styles.getPropertyValue('--brand-blue-50').trim() || '#D2DAE4';
    const baselineOffset = 12;
    const tickColor = styles.getPropertyValue('--Text-text-secondary').trim() || '#414651';
    const amountFontSize = parseFloat(styles.getPropertyValue('--Font-size-Disclaimer')) || 10;
    const amountLineHeight = styles.getPropertyValue('--Line-height-Disclaimer').trim() || '12px';
    const chart = new Chart(canvas, {
      type: 'line',
      plugins: [{
        id: 'full-width-baseline',
        afterDraw: (chartInstance) => {
          const { ctx, chartArea, scales } = chartInstance;
          const baselineY = chartArea.bottom + baselineOffset;
          ctx.save();
          ctx.beginPath();
          ctx.strokeStyle = gridColor;
          ctx.lineWidth = 1;
          scales.x.ticks.forEach((tick, index) => {
            const tickX = scales.x.getPixelForTick(index);
            ctx.moveTo(tickX, chartArea.bottom);
            ctx.lineTo(tickX, baselineY);
          });
          ctx.stroke();
          ctx.beginPath();
          ctx.strokeStyle = baselineColor;
          ctx.moveTo(0, baselineY);
          ctx.lineTo(chartArea.right, baselineY);
          ctx.stroke();
          ctx.restore();
        },
      }],
      data: {
        labels,
        datasets: [{
          label,
          data: values,
          hidden: !returnsVisible,
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
            grid: { color: gridColor, drawTicks: false },
            border: { display: false },
            afterFit: (scale) => {
              scale.height -= scale.options.ticks.padding;
            },
            ticks: {
              autoSkip: true,
              maxRotation: 0,
              padding: () => baselineOffset + (window.matchMedia('(min-width: 900px)').matches ? 17 : 8),
              color: '#414651',
              font: {
                family: styles.fontFamily,
                size: 10,
                weight: 500,
                lineHeight: '12px',
              },
            },
          },
          y: {
            beginAtZero: true,
            grid: { display: false },
            border: { display: false },
            ticks: {
              count: 5,
              color: tickColor,
              callback: formatAmount,
              font: {
                family: styles.fontFamily,
                size: amountFontSize,
                style: 'normal',
                weight: 500,
                lineHeight: amountLineHeight,
              },
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
    const finalAmount = Number(result.finalAmount);
    const formattedAmount = Math.round(Number.isFinite(finalAmount) ? finalAmount : 0).toLocaleString('en-IN');
    amountElement.textContent = `\u20B9 ${formattedAmount}`;
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

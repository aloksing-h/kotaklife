import { moveInstrumentation } from '../../scripts/scripts.js';

const DEFAULTS = {
  resultLabel: 'You may get',
  summaryTemplate: 'If you invest {investmentAmount} {frequency} for {investmentYears} years at {rate}% p.a.',
  chartLabel: 'Your returns',
  ctaLabel: 'Invest Now',
};

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

function formatAxisValue(value) {
  return Math.round(value).toLocaleString('en-IN');
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
          <span class="chart-legend-label"></span>
        </div>
        <canvas class="chart-canvas" width="600" height="360" role="img"></canvas>
      </div>
      <a class="result-cta"><span class="cta-label"></span></a>
    </div>`;

  const resultLabelElement = block.querySelector('.result-label');
  const summaryElement = block.querySelector('.investment-summary');
  const amountElement = block.querySelector('.result-amount');
  const chartLabelElement = block.querySelector('.chart-legend-label');
  const chart = block.querySelector('.chart-canvas');
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

  function drawChart(data) {
    const context = chart.getContext('2d');
    const bounds = chart.getBoundingClientRect();
    if (!context || !bounds.width || !bounds.height) return;

    const pixelRatio = window.devicePixelRatio || 1;
    chart.width = Math.round(bounds.width * pixelRatio);
    chart.height = Math.round(bounds.height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, bounds.width, bounds.height);

    const points = (data || []).filter((point) => (
      Number.isFinite(Number(point.year)) && Number.isFinite(Number(point.balance))
    ));
    chart.setAttribute('aria-label', points.length
      ? `${chartLabel}: ${points.map((point) => `${point.year}, ${formatCurrency(point.balance)}`).join('; ')}`
      : chartLabel);
    if (!points.length) return;

    const plotLeft = bounds.width * 0.23;
    const plotRight = bounds.width * 0.98;
    const plotTop = bounds.height * 0.08;
    const plotBottom = bounds.height * 0.78;
    const plotWidth = plotRight - plotLeft;
    const plotHeight = plotBottom - plotTop;
    const maximum = Math.max(...points.map((point) => Number(point.balance)), 1);
    const axisMaximum = maximum * 1.08;
    const styles = getComputedStyle(block);
    const gridColor = styles.getPropertyValue('--brand-blue-50').trim();
    const lineColor = styles.getPropertyValue('--brand-blue-600').trim();
    const labelColor = styles.getPropertyValue('--gray-600').trim();
    const fontSize = Number.parseFloat(styles.fontSize) * 0.7;

    context.font = `${fontSize}px ${styles.fontFamily}`;
    context.textAlign = 'right';
    context.textBaseline = 'middle';
    context.fillStyle = labelColor;
    context.strokeStyle = gridColor;
    context.lineWidth = 1;

    for (let tick = 0; tick <= 4; tick += 1) {
      const fraction = tick / 4;
      const y = plotBottom - plotHeight * fraction;
      context.beginPath();
      context.moveTo(plotLeft, y);
      context.lineTo(plotRight, y);
      context.stroke();
      context.fillText(formatAxisValue(axisMaximum * fraction), plotLeft - bounds.width * 0.03, y);
    }

    context.strokeStyle = gridColor;
    points.forEach((point, index) => {
      const x = points.length === 1
        ? plotLeft + plotWidth / 2
        : plotLeft + (plotWidth * index) / (points.length - 1);
      context.beginPath();
      context.moveTo(x, plotTop);
      context.lineTo(x, plotBottom);
      context.stroke();
      context.textAlign = 'center';
      context.fillStyle = labelColor;
      context.fillText(String(point.year), x, bounds.height * 0.9);
    });

    context.beginPath();
    points.forEach((point, index) => {
      const x = points.length === 1
        ? plotLeft + plotWidth / 2
        : plotLeft + (plotWidth * index) / (points.length - 1);
      const y = plotBottom - (Number(point.balance) / axisMaximum) * plotHeight;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.strokeStyle = lineColor;
    context.lineWidth = Math.max(1, bounds.width * 0.006);
    context.stroke();

    points.forEach((point, index) => {
      const x = points.length === 1
        ? plotLeft + plotWidth / 2
        : plotLeft + (plotWidth * index) / (points.length - 1);
      const y = plotBottom - (Number(point.balance) / axisMaximum) * plotHeight;
      context.beginPath();
      context.arc(x, y, Math.max(2, bounds.width * 0.012), 0, Math.PI * 2);
      context.fillStyle = lineColor;
      context.fill();
    });
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
    drawChart(result.yearlyData);
  }

  const scope = block.closest('.compound-calculator') || block.closest('.section') || document;
  scope.addEventListener('compound-plan-update', (event) => {
    updateResult(event.detail, event.detail);
  });
  updateResult(scope.compoundPlanInputs, scope.compoundPlanResult);

  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(() => {
      drawChart(scope.compoundPlanResult?.yearlyData);
    });
    resizeObserver.observe(chart);
  }
}

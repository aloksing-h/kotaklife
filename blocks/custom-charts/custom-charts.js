import { loadScript } from '../../scripts/aem.js';

/**
 * Extracts chart items from the authored block table rows.
 * Handles comma-separated numbers (e.g., "1,200,000") gracefully.
 */
function getChartItems(block) {
  return [...block.children].map((row) => {
    const columns = [...row.children];
    const label = columns[0]?.textContent.trim();
    const rawValue = columns[1]?.textContent.trim().replace(/,/g, '');
    const value = Number.parseFloat(rawValue);
    return { label, value };
  }).filter(({ label, value }) => label && Number.isFinite(value));
}

export default async function decorate(block) {
  const items = getChartItems(block);

  // Fallback data matching the exact visual mockup if no authored data exists
  const defaultItems = [
    { label: '2026', value: 400000 },
    { label: '2027', value: 450000 },
    { label: '2028', value: 530000 },
    { label: '2029', value: 700000 },
    { label: '2030', value: 900000 },
    { label: '2031', value: 1160000 },
    { label: '2032', value: 1450000 },
    { label: '2033', value: 1670000 },
    { label: '2034', value: 1820000 },
    { label: '2035', value: 1900000 },
  ];

  const chartData = items.length ? items : defaultItems;
  const labels = chartData.map((item) => item.label);
  const dataValues = chartData.map((item) => item.value);

  const canvas = document.createElement('canvas');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Your returns chart');

  block.textContent = '';
  block.append(canvas);

  await loadScript(`${window.hlx.codeBasePath}/scripts/chart.js`);
  if (!window.Chart) return;

  // eslint-disable-next-line no-new
  new window.Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Your returns',
        data: dataValues,
        borderColor: '#1E4679', // Deep blue line
        borderWidth: 2.5,
        tension: 0.4, // Smooth curved line
        pointBackgroundColor: '#1E4679',
        pointBorderColor: '#FFFFFF', // White border overlay cutout around points
        pointBorderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 8,
            boxHeight: 8,
            color: '#535862',
            font: {
              size: 14,
              family: 'sans-serif',
            },
          },
        },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.dataset.label}: ${context.parsed.y.toLocaleString('en-US')}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: true,
            drawOnChartArea: true,
            drawTicks: false,
            color: '#E4E7EC', // Vertical gridlines
            lineWidth: 1,
          },
          ticks: {
            color: '#535862',
            font: { size: 12 },
            padding: 10,
          },
        },
        y: {
          min: 200000,
          max: 2000000,
          ticks: {
            stepSize: 400000,
            color: '#535862',
            font: { size: 12 },
            padding: 10,
            callback(value) {
              return value.toLocaleString('en-US'); // Formats tick marks as 400,000, 800,000, etc.
            },
          },
          grid: {
            display: true,
            drawBorder: false,
            // Displays only the bottom horizontal baseline
            color: (context) => (context.tick.value === 200000 ? '#E4E7EC' : 'transparent'),
            lineWidth: 1,
          },
        },
      },
    },
  });
}

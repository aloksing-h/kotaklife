import { loadScript } from '../../scripts/aem.js';

function getChartItems(block) {
  return [...block.children].map((row) => {
    const columns = [...row.children];
    const label = columns[0]?.textContent.trim();
    const value = Number.parseFloat(columns[1]?.textContent.trim());
    return { label, value };
  }).filter(({ label, value }) => label && Number.isFinite(value));
}

export default async function decorate(block) {
  const items = getChartItems(block);
  const canvas = document.createElement('canvas');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Chart');

  block.textContent = '';
  block.append(canvas);

  if (!items.length) return;

  await loadScript(`${window.hlx.codeBasePath}/scripts/chart.js`);
  if (!window.Chart) return;

  // Chart.js owns the canvas rendering; the block owns the authored data.
  // eslint-disable-next-line no-new
  new window.Chart(canvas, {
    type: 'bar',
    data: {
      labels: items.map(({ label }) => label),
      datasets: [{
        label: 'Value',
        data: items.map(({ value }) => value),
        backgroundColor: '#0078d4',
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
}

import { loadCSS } from '../../scripts/aem.js';

/**
 * Initializes the page-wide pulse route animation.
 */
export default async function initPulseAnimation() {
  await loadCSS(`${window.hlx.codeBasePath}/blocks/pulse-animation/pulse-animation.css`);
  const main = document.querySelector('main');
  if (!main || main.querySelector('.pulse-overlay-container')) return;

  const svgContainer = document.createElement('div');
  svgContainer.className = 'pulse-overlay-container';
  svgContainer.setAttribute('aria-hidden', 'true');

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');

  const defs = document.createElementNS(svgNS, 'defs');
  const gradient = document.createElementNS(svgNS, 'linearGradient');
  gradient.id = 'pulse-gradient';
  gradient.setAttribute('x1', '-72.9945');
  gradient.setAttribute('y1', '58.7128');
  gradient.setAttribute('x2', '151.729');
  gradient.setAttribute('y2', '-14.8482');
  gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
  gradient.innerHTML = `
    <stop offset="0.116685" stop-color="#FFFFFF" />
    <stop offset="0.382537" stop-color="#B2DDFF" />
    <stop offset="0.648389" stop-color="#B2DDFF" />
    <stop offset="0.779171" stop-color="#FA1432" />
    <stop offset="1" stop-color="#FA1432" />
  `;
  const filter = document.createElementNS(svgNS, 'filter');
  filter.id = 'pulse-glow';
  filter.setAttribute('x', '-5.72205e-06');
  filter.setAttribute('y', '-5.72205e-06');
  filter.setAttribute('width', '198.002');
  filter.setAttribute('height', '81.625');
  filter.setAttribute('filterUnits', 'userSpaceOnUse');
  const blur = document.createElementNS(svgNS, 'feGaussianBlur');
  blur.setAttribute('stdDeviation', '13');
  filter.append(blur);
  defs.append(gradient, filter);

  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('class', 'pulse-route-path');
  const glowPath = document.createElementNS(svgNS, 'path');
  glowPath.setAttribute('class', 'pulse-head-glow');
  const headPath = document.createElementNS(svgNS, 'path');
  headPath.setAttribute('class', 'pulse-head-path');
  headPath.setAttribute('fill', 'url(#pulse-gradient)');

  const pulseHead = document.createElementNS(svgNS, 'g');
  pulseHead.append(glowPath, headPath);

  svg.append(defs, path, pulseHead);
  svgContainer.appendChild(svg);
  main.prepend(svgContainer);

  let pathLength = 0;
  let currentProgress = 0;
  let initialHeadDistance = 200;
  let scaleX = 1;
  let scaleY = 1;

  function getRoutePath(width, height) {
    const isMobile = window.matchMedia('(max-width: 899px)').matches;
    if (isMobile) {
      return `M ${width * 0.86} 0
        C ${width * 0.86} ${height * 0.08}, ${width * 0.27} ${height * 0.11}, ${width * 0.27} ${height * 0.18}
        C ${width * 0.27} ${height * 0.24}, ${width * 0.86} ${height * 0.26}, ${width * 0.86} ${height * 0.34}
        C ${width * 0.86} ${height * 0.43}, ${width * 0.22} ${height * 0.48}, ${width * 0.22} ${height * 0.58}
        C ${width * 0.22} ${height * 0.68}, ${width * 0.84} ${height * 0.75}, ${width * 0.84} ${height}`;
    }
    return `M ${width * 0.51} 0
      C ${width * 0.51} ${height * 0.05}, ${width * 0.87} ${height * 0.06}, ${width * 0.87} ${height * 0.12}
      C ${width * 0.87} ${height * 0.18}, ${width * 0.22} ${height * 0.19}, ${width * 0.22} ${height * 0.29}
      C ${width * 0.22} ${height * 0.39}, ${width * 0.79} ${height * 0.41}, ${width * 0.79} ${height * 0.52}
      C ${width * 0.79} ${height * 0.64}, ${width * 0.19} ${height * 0.67}, ${width * 0.19} ${height * 0.78}
      C ${width * 0.19} ${height * 0.88}, ${width * 0.69} ${height * 0.9}, ${width * 0.69} ${height}`;
  }

  function buildPulseHead(headDistance) {
    const targetLength = 155;
    let low = Math.max(0, headDistance - (targetLength / Math.min(scaleX, scaleY)) * 2.5);
    let high = headDistance;
    for (let iteration = 0; iteration < 14; iteration += 1) {
      const middle = (low + high) / 2;
      const steps = 8;
      let screenDistance = 0;
      let previous = path.getPointAtLength(middle);
      for (let step = 1; step <= steps; step += 1) {
        const point = path.getPointAtLength(middle + ((headDistance - middle) * step) / steps);
        screenDistance += Math.hypot(
          (point.x - previous.x) * scaleX,
          (point.y - previous.y) * scaleY,
        );
        previous = point;
      }
      if (screenDistance < targetLength) high = middle;
      else low = middle;
    }
    const startDistance = (low + high) / 2;
    const sampleCount = 28;
    const topPoints = [];
    const bottomPoints = [];

    for (let index = 0; index <= sampleCount; index += 1) {
      const progress = index / sampleCount;
      const distance = startDistance + (headDistance - startDistance) * progress;
      const point = path.getPointAtLength(distance);
      const previous = path.getPointAtLength(Math.max(0, distance - 1.5));
      const next = path.getPointAtLength(Math.min(pathLength, distance + 1.5));
      const tangentX = next.x - previous.x;
      const tangentY = next.y - previous.y;
      const tangentLength = Math.hypot(tangentX * scaleX, tangentY * scaleY) || 1;
      const halfWidth = 22 * ((1 - progress) ** 1.15);
      const normalX = -(tangentY * scaleY) / tangentLength;
      const normalY = (tangentX * scaleX) / tangentLength;
      topPoints.push({
        x: point.x + (normalX * halfWidth) / scaleX,
        y: point.y + (normalY * halfWidth) / scaleY,
      });
      bottomPoints.push({
        x: point.x - (normalX * halfWidth) / scaleX,
        y: point.y - (normalY * halfWidth) / scaleY,
      });
    }

    const points = [
      topPoints[sampleCount],
      ...topPoints.slice(0, sampleCount).reverse(),
      ...bottomPoints,
    ];
    const pulsePath = `M ${points.map(({ x, y }) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L ')} Z`;
    glowPath.setAttribute('d', pulsePath);
    headPath.setAttribute('d', pulsePath);
    const tail = path.getPointAtLength(startDistance);
    const tip = path.getPointAtLength(headDistance);
    gradient.setAttribute('x1', tail.x);
    gradient.setAttribute('y1', tail.y);
    gradient.setAttribute('x2', tip.x);
    gradient.setAttribute('y2', tip.y);
  }

  function updatePulse(progress) {
    currentProgress = progress;
    const headDistance = Math.max(initialHeadDistance, pathLength * progress);
    buildPulseHead(Math.min(pathLength, headDistance));
  }

  function updatePath() {
    const width = main.clientWidth;
    const height = main.scrollHeight;
    scaleX = width / 800 || 1;
    scaleY = height / 2520 || 1;
    svgContainer.style.height = `${height}px`;
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    path.setAttribute('d', getRoutePath(width, height));
    pathLength = path.getTotalLength();
    const isMobile = window.matchMedia('(max-width: 899px)').matches;
    const banner = main.querySelector('.video-banner-container, .hero-banner, .banner');
    const bannerHeight = banner?.getBoundingClientRect().height || (isMobile ? 420 : 520);
    const initialTargetY = Math.max(200, Math.min(
      bannerHeight * (isMobile ? 0.45 : 0.5),
      isMobile ? 360 : 420,
    ));
    let distance = 0;
    while (distance < pathLength && path.getPointAtLength(distance).y < initialTargetY) {
      distance += 1;
    }
    initialHeadDistance = Math.min(distance, pathLength);
    updatePulse(currentProgress);
  }

  function updateScrollPulse() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      updatePulse(1);
      return;
    }
    const { scrollY } = window;
    const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
    const scrollProgress = scrollMax > 0 ? Math.min(1, scrollY / scrollMax) : 0;
    const startProgress = pathLength > 0 ? initialHeadDistance / pathLength : 0;
    updatePulse(startProgress + ((1 - startProgress) * scrollProgress));
  }

  updatePath();
  updateScrollPulse();

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateScrollPulse();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  const resizeObserver = new ResizeObserver(() => {
    updatePath();
    updateScrollPulse();
  });
  resizeObserver.observe(main);
}

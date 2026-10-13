/* global gsap, MotionPathPlugin, ScrollTrigger */
import { loadScript } from '../../scripts/aem.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const TRIGGER_ID = 'pulse-animation';
const DEFAULT_ARROW_PATH = 'M-20,-8 L5,-8 L5,-18 L25,0 L5,18 L5,8 L-20,8 Z';

// sections use data-animation-point-mobile below the desktop breakpoint
const desktopQuery = window.matchMedia('(min-width: 900px)');
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

// the line and arrow are shared by the page, so they live at module level
let gsapReady;
let overlayPath;
let arrow;
let redrawTimeout;
let layoutWatched = false;

// GSAP UMD bundles must load in order: core first, then its plugins.
async function loadGsap() {
  if (!gsapReady) {
    gsapReady = (async () => {
      await loadScript(`${window.hlx.codeBasePath}/scripts/thirdparty/gsap.min.js`);
      await Promise.all([
        loadScript(`${window.hlx.codeBasePath}/scripts/thirdparty/motionpathplugin.min.js`),
        loadScript(`${window.hlx.codeBasePath}/scripts/thirdparty/scrolltrigger.min.js`),
      ]);
      gsap.registerPlugin(MotionPathPlugin, ScrollTrigger);
    })();
  }
  return gsapReady;
}

/**
 * Creates the SVG overlay that holds the line. It spans the whole of main,
 * so it is appended to main rather than to the block.
 * @param {Element} main The main element
 */
function createOverlay(main) {
  if (overlayPath?.isConnected) return;

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.classList.add('pulse-animation-overlay');
  svg.setAttribute('aria-hidden', 'true');
  overlayPath = document.createElementNS(SVG_NS, 'path');
  overlayPath.classList.add('pulse-animation-path');
  svg.append(overlayPath);
  main.append(svg);
}

// Fallback graphic used when no image is authored on the block.
function createDefaultArrow() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '-25 -25 50 50');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('fill', '#E74C3C');
  path.setAttribute('d', DEFAULT_ARROW_PATH);

  svg.append(path);
  return svg;
}

/**
 * Builds the arrow from the authored image. Images arrive via the Media Bus as a
 * <picture>; SVGs are delivered as content and may render as a link, so both work.
 * The graphic should point right (0°): autoRotate turns it along the path.
 * @param {Element} block The pulse-animation block
 * @returns {Promise<HTMLImageElement|null>} the arrow image, or null if none authored
 */
async function getAuthoredArrow(block) {
  const img = block.querySelector('img');
  const link = block.querySelector('a[href]');
  const src = img?.getAttribute('src') || link?.getAttribute('href');
  if (!src) return null;

  const graphic = document.createElement('img');
  graphic.src = src;
  graphic.alt = img?.alt || '';
  // wait for the intrinsic size so alignOrigin centres the graphic on the path
  await graphic.decode().catch(() => { });
  return graphic;
}

/**
 * Creates the arrow that travels along the line, replacing the one of a
 * previous decoration (e.g. a Universal Editor re-render).
 * @param {Element} block The pulse-animation block
 * @param {Element} main The main element
 */
async function createArrow(block, main) {
  const graphic = (await getAuthoredArrow(block)) || createDefaultArrow();
  graphic.classList.add('pulse-animation-arrow-graphic');

  arrow?.remove();
  arrow = document.createElement('div');
  arrow.classList.add('pulse-animation-arrow');
  arrow.append(graphic);
  main.append(arrow);
}

/**
 * Returns the box the authored percentages refer to: the section including its
 * margins, in pixels relative to main (the overlay's positioning context).
 * @param {Element} section The section element
 * @param {DOMRect} origin The bounding rect of main
 * @returns {{x: number, y: number, width: number, height: number}}
 */
function getSectionBox(section, origin) {
  const rect = section.getBoundingClientRect();
  const style = window.getComputedStyle(section);
  const marginTop = parseFloat(style.marginTop) || 0;
  const marginBottom = parseFloat(style.marginBottom) || 0;
  const marginLeft = parseFloat(style.marginLeft) || 0;
  const marginRight = parseFloat(style.marginRight) || 0;

  return {
    x: rect.left - origin.left - marginLeft,
    y: rect.top - origin.top - marginTop,
    width: rect.width + marginLeft + marginRight,
    height: rect.height + marginTop + marginBottom,
  };
}

/**
 * Converts the authored section points ("x,y | x,y" in % of the section box)
 * to pixels relative to main.
 * @param {Element} main The main element
 * @returns {{x: number, y: number}[]} points in document order
 */
function getPoints(main) {
  const origin = main.getBoundingClientRect();
  const points = [];

  main.querySelectorAll('[data-animation-point], [data-animation-point-mobile]').forEach((section) => {
    const data = desktopQuery.matches
      ? section.dataset.animationPoint
      : section.dataset.animationPointMobile || section.dataset.animationPoint;
    if (!data) return;

    const box = getSectionBox(section, origin);
    data.split('|').forEach((pair) => {
      const [x, y] = pair.split(',').map((value) => parseFloat(value));
      if (Number.isNaN(x) || Number.isNaN(y)) return;
      points.push({ x: box.x + box.width * (x / 100), y: box.y + box.height * (y / 100) });
    });
  });

  return points;
}

/**
 * Draws the curve through the current breakpoint's points.
 * @param {Element} main The main element
 * @returns {boolean} false when there are not enough points for a line
 */
function drawPath(main) {
  const points = getPoints(main);
  if (points.length < 2) {
    overlayPath.removeAttribute('d');
    return false;
  }

  const rawPath = MotionPathPlugin.arrayToRawPath(points, { curviness: 1.5 });
  overlayPath.setAttribute('d', MotionPathPlugin.rawPathToString(rawPath));
  return true;
}

function killAnimation() {
  const previous = ScrollTrigger.getById(TRIGGER_ID);
  previous?.animation?.kill();
  previous?.kill();
}

// Moves the arrow along the line, scrubbed by scroll; it flips when scrolling up.
function animate() {
  const graphic = arrow.querySelector('.pulse-animation-arrow-graphic');
  let currentDirection = 1;

  gsap.to(arrow, {
    motionPath: {
      path: overlayPath,
      align: overlayPath,
      alignOrigin: [0.5, 0.5],
      autoRotate: true,
    },
    scrollTrigger: {
      id: TRIGGER_ID,
      trigger: overlayPath,
      start: 'top center',
      end: 'bottom center',
      scrub: 1,
      onUpdate: (self) => {
        if (self.direction !== currentDirection) {
          currentDirection = self.direction;
          gsap.to(graphic, {
            scaleX: currentDirection,
            duration: 0.3,
            overwrite: 'auto',
          });
        }
      },
    },
    ease: 'none',
  });
}

/**
 * Redraws the line and rebuilds the arrow animation for the current layout.
 * The tween is recreated because MotionPathPlugin reads the path when it starts.
 * @param {Element} main The main element
 */
function render(main) {
  killAnimation();
  const hasPath = drawPath(main);
  // with reduced motion only the static line is shown
  arrow.hidden = !hasPath || reducedMotionQuery.matches;
  if (!arrow.hidden) animate();
  ScrollTrigger.refresh();
}

function scheduleRender(main) {
  clearTimeout(redrawTimeout);
  redrawTimeout = setTimeout(() => render(main), 150);
}

/**
 * Re-renders when the layout changes: viewport resizes, late layout shifts
 * (fonts, images) and switching between the mobile and desktop points.
 * @param {Element} main The main element
 */
function watchLayout(main) {
  if (layoutWatched) return;
  layoutWatched = true;

  new ResizeObserver(() => scheduleRender(main)).observe(main);
  desktopQuery.addEventListener('change', () => render(main));
  reducedMotionQuery.addEventListener('change', () => render(main));
}

async function setup(block, main) {
  createOverlay(main);
  await createArrow(block, main);
  render(main);
  watchLayout(main);
}

// The path editor is only for authors: inside Universal Editor or with ?pulse-edit.
function isEditMode() {
  return window.self !== window.top
    || new URLSearchParams(window.location.search).has('pulse-edit');
}

async function loadEditor(main) {
  const { default: initEditor } = await import('./pulse-editor.js');
  initEditor({
    main,
    desktopQuery,
    getSectionBox,
    drawPath: () => drawPath(main),
    render: () => render(main),
  });
}

/**
 * loads and decorates the block
 * @param {Element} block The pulse-animation block
 */
export default async function decorate(block) {
  await loadGsap();
  const main = block.closest('main');
  if (!main) return;

  // Points are measured once every section is laid out. Not awaited: sections
  // wait for decorate(), so awaiting the remaining sections here would never resolve.
  setup(block, main).then(() => {
    if (isEditMode()) loadEditor(main);
  });
}

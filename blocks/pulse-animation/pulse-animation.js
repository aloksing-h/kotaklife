/* global gsap, MotionPathPlugin, ScrollTrigger */
import { loadScript } from '../../scripts/aem.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const TRIGGER_ID = 'pulse-animation';
const MIN_SIDE_INSET = 24;
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

const toPixels = (box, p) => ({
  x: box.x + box.width * (p.x / 100),
  y: box.y + box.height * (p.y / 100),
});

const toPercent = (box, p) => ({
  x: ((p.x - box.x) / box.width) * 100,
  y: ((p.y - box.y) / box.height) * 100,
});

// parses authored points: "x,y | x,y" in % of the section box
function parsePoints(value = '') {
  return value.split('|').map((pair) => {
    const [x, y] = pair.split(',').map((v) => parseFloat(v));
    return { x, y };
  }).filter(({ x, y }) => !Number.isNaN(x) && !Number.isNaN(y));
}

/**
 * Vertical lines the pulse can safely run along, in pixels relative to main:
 * the middle of each side gutter, the edges of the content column and the centre.
 * The narrowest content column on the page is used, so full-bleed sections
 * don't pull the line to the screen edge.
 * @param {Element} main The main element
 */
function getGuides(main) {
  const origin = main.getBoundingClientRect();
  let contentLeft = 0;
  main.querySelectorAll(':scope > .section > div').forEach((column) => {
    const rect = column.getBoundingClientRect();
    const padding = parseFloat(window.getComputedStyle(column).paddingLeft) || 0;
    contentLeft = Math.max(contentLeft, rect.left - origin.left + padding);
  });
  const contentRight = origin.width - contentLeft;
  // narrow mobile gutters would let the curve swing off-screen
  const side = Math.max(contentLeft / 2, MIN_SIDE_INSET);

  return {
    left: side,
    contentLeft,
    center: origin.width / 2,
    contentRight,
    right: origin.width - side,
  };
}

/**
 * Pulse Path presets, chosen per section in its metadata. Each returns pixel
 * points relative to main, built from the live layout, so the line keeps to the
 * side gutters and the gaps between sections at every width.
 */
const PRESETS = (() => {
  const side = (x) => (l) => [{ x, y: l.at(0.15) }, { x, y: l.at(0.85) }];
  // runs down one side, then crosses through the gap below the section
  const cross = (from) => (l) => [
    { x: l.guides[from], y: l.at(0.15) },
    { x: l.guides[from], y: l.at(0.7) },
    { x: l.guides.center, y: l.gapBelow },
  ];
  // runs down one side with a loop that swings in towards the content
  const loop = (at, direction) => (l) => {
    const x = l.guides[at];
    const r = l.loopRadius;
    const d = direction * r;
    const m = l.at(0.5);
    return [
      { x, y: l.at(0.15) },
      { x, y: m },
      { x: x + d, y: m + r },
      { x: x + 2 * d, y: m },
      { x: x + d, y: m - r },
      { x, y: l.at(0.85) },
    ];
  };

  return {
    left: (l) => side(l.guides.left)(l),
    right: (l) => side(l.guides.right)(l),
    'left-to-right': cross('left'),
    'right-to-left': cross('right'),
    'loop-left': loop('left', 1),
    'loop-right': loop('right', -1),
  };
})();

function getPresetPoints(name, section, main, origin) {
  const preset = PRESETS[name];
  if (!preset) return null;

  const rect = section.getBoundingClientRect();
  const marginBottom = parseFloat(window.getComputedStyle(section).marginBottom) || 0;
  const top = rect.top - origin.top;
  return preset({
    guides: getGuides(main),
    at: (fraction) => top + rect.height * fraction,
    gapBelow: top + rect.height + marginBottom / 2,
    loopRadius: Math.min(80, origin.width * 0.1),
  });
}

/**
 * The points a section contributes at the current breakpoint, in % of its box.
 * The section's Pulse Path decides: a preset is computed from the layout;
 * "custom" uses the authored points (mobile falls back to the desktop ones).
 * @param {Element} section The section element
 * @param {Element} main The main element
 * @returns {{source: string, box: object, points: {x: number, y: number}[]}}
 *   source is 'custom', 'preset', 'desktop' or 'none'
 */
function getSectionPoints(section, main) {
  const origin = main.getBoundingClientRect();
  const box = getSectionBox(section, origin);
  const { animationPoint, animationPointMobile, pulsePath } = section.dataset;

  // Custom points are used when Pulse Path is "custom", or when it is not set
  // but points exist (content authored before the dropdown existed).
  if (pulsePath === 'custom' || (!pulsePath && (animationPoint || animationPointMobile))) {
    if (!desktopQuery.matches && animationPointMobile) {
      return { source: 'custom', box, points: parsePoints(animationPointMobile) };
    }
    if (desktopQuery.matches) return { source: 'custom', box, points: parsePoints(animationPoint) };
    // mobile without its own points uses the desktop ones
    return { source: 'desktop', box, points: parsePoints(animationPoint) };
  }

  const preset = getPresetPoints(pulsePath, section, main, origin);
  if (preset) return { source: 'preset', box, points: preset.map((p) => toPercent(box, p)) };

  return { source: 'none', box, points: [] };
}

/**
 * Collects the points of every section, in pixels relative to main.
 * @param {Element} main The main element
 * @returns {{x: number, y: number}[]} points in document order
 */
function getPoints(main) {
  return [...main.querySelectorAll(':scope > .section')].flatMap((section) => {
    const { box, points } = getSectionPoints(section, main);
    return points.map((p) => toPixels(box, p));
  });
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
    getSectionPoints: (section) => getSectionPoints(section, main),
    getGuides: () => getGuides(main),
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

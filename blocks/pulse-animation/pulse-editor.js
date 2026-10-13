/**
 * Path editor for the pulse-animation block, loaded only for authors (inside
 * Universal Editor or with ?pulse-edit). Authors drag, add and remove points on
 * the real page, then copy each section's value into its section metadata:
 * "Animation Point" on desktop, "Animation Point mobile" below 900px.
 *
 * - click on the page: add a point to the section under the cursor
 * - drag a point: move it (snaps to layout guides, hold Alt to place freely)
 * - double-click a point: remove it
 */
import { loadCSS } from '../../scripts/aem.js';

const SNAP_DISTANCE = 12;

let api;
let layer;
let panel;
let list;
let enabled = false;
let dragging = null;
let ignoreMutations = false;
let renderTimeout;

const round = (value) => Math.round(value * 10) / 10;

function parsePoints(value = '') {
  return value.split('|').map((pair) => {
    const [x, y] = pair.split(',').map((v) => parseFloat(v));
    return { x, y };
  }).filter(({ x, y }) => !Number.isNaN(x) && !Number.isNaN(y));
}

const formatPoints = (points) => points.map(({ x, y }) => `${round(x)},${round(y)}`).join(' | ');

const isDesktop = () => api.desktopQuery.matches;

const getSections = () => [...api.main.querySelectorAll(':scope > .section')];

function getSectionName(section, index) {
  const name = [...section.classList]
    .find((c) => c !== 'section' && !c.endsWith('-container'))
    || [...section.classList].find((c) => c.endsWith('-container'))?.replace('-container', '');
  return `${index + 1}. ${name || 'section'}`;
}

// the points the live page uses at the current breakpoint (mobile falls back to desktop)
function readPoints(section) {
  const { animationPoint, animationPointMobile } = section.dataset;
  return parsePoints(isDesktop() ? animationPoint : animationPointMobile || animationPoint);
}

function writePoints(section, points) {
  const key = isDesktop() ? 'animationPoint' : 'animationPointMobile';
  ignoreMutations = true;
  if (points.length) section.dataset[key] = formatPoints(points);
  else delete section.dataset[key];
  // let the MutationObserver see the change before re-enabling it
  setTimeout(() => { ignoreMutations = false; });
}

function getModel() {
  const origin = api.main.getBoundingClientRect();
  return getSections().map((el, index) => ({
    el,
    index,
    box: api.getSectionBox(el, origin),
    points: readPoints(el),
  }));
}

const toPixels = (box, p) => ({
  x: box.x + box.width * (p.x / 100),
  y: box.y + box.height * (p.y / 100),
});

const toPercent = (box, p) => ({
  x: ((p.x - box.x) / box.width) * 100,
  y: ((p.y - box.y) / box.height) * 100,
});

function findSectionAt(model, y) {
  return model.find(({ box }) => y >= box.y && y < box.y + box.height)
    || (y < model[0].box.y ? model[0] : model[model.length - 1]);
}

/**
 * Vertical guides the line can safely run along: the side gutters, the edges
 * of the content column and the centre.
 */
function getGuides() {
  const origin = api.main.getBoundingClientRect();
  const column = api.main.querySelector(':scope > .section > div');
  if (!column) return [origin.width / 2];
  const rect = column.getBoundingClientRect();
  const style = window.getComputedStyle(column);
  const left = rect.left - origin.left + (parseFloat(style.paddingLeft) || 0);
  const right = rect.right - origin.left - (parseFloat(style.paddingRight) || 0);
  return [left / 2, left, origin.width / 2, right, (right + origin.width) / 2];
}

function snapX(x, free) {
  if (free) return x;
  const guide = getGuides().find((g) => Math.abs(g - x) <= SNAP_DISTANCE);
  return guide ?? x;
}

/**
 * Inserts a point into a section where it lengthens the line the least,
 * taking the neighbouring sections' points into account.
 */
function insertPoint(model, sectionIndex, point) {
  const target = model[sectionIndex];
  const sectionPixels = (s) => s.points.map((p) => toPixels(s.box, p));
  const before = model.slice(0, sectionIndex).flatMap(sectionPixels);
  const after = model.slice(sectionIndex + 1).flatMap(sectionPixels);
  const own = target.points.map((p) => toPixels(target.box, p));
  const px = toPixels(target.box, point);
  const dist = (a, b) => (a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0);

  let best = own.length;
  let bestCost = Infinity;
  for (let i = 0; i <= own.length; i += 1) {
    const prev = i === 0 ? before[before.length - 1] : own[i - 1];
    const next = i === own.length ? after[0] : own[i];
    const cost = dist(prev, px) + dist(px, next) - dist(prev, next);
    if (cost < bestCost) {
      bestCost = cost;
      best = i;
    }
  }
  target.points.splice(best, 0, point);
}

function getLocalPosition(event) {
  const origin = api.main.getBoundingClientRect();
  return { x: event.clientX - origin.left, y: event.clientY - origin.top };
}

function scheduleRender() {
  clearTimeout(renderTimeout);
  renderTimeout = setTimeout(() => api.render(), 100);
}

function updatePanel(model) {
  panel.querySelector('.pulse-editor-mode').textContent = isDesktop()
    ? 'Desktop: paste into "Animation Point"'
    : 'Mobile: paste into "Animation Point mobile"';

  list.replaceChildren(...model.map(({ el, index, points }) => {
    const row = document.createElement('li');
    const label = document.createElement('span');
    label.className = 'pulse-editor-label';
    label.textContent = getSectionName(el, index);

    const input = document.createElement('input');
    input.readOnly = true;
    input.value = formatPoints(points);
    input.setAttribute('aria-label', `Points for section ${index + 1}`);

    const copy = document.createElement('button');
    copy.type = 'button';
    copy.textContent = 'Copy';
    copy.disabled = !points.length;
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(input.value);
      } catch {
        // the editor iframe may not allow clipboard access
        input.select();
        document.execCommand('copy');
      }
      copy.textContent = 'Copied';
      setTimeout(() => { copy.textContent = 'Copy'; }, 1200);
    });

    const clear = document.createElement('button');
    clear.type = 'button';
    clear.textContent = 'Clear';
    clear.disabled = !points.length;
    clear.addEventListener('click', () => {
      writePoints(el, []);
      api.render();
      // eslint-disable-next-line no-use-before-define
      refresh();
    });

    row.append(label, input, copy, clear);
    return row;
  }));
}

function updateLayer(model) {
  const origin = api.main.getBoundingClientRect();
  const nodes = [];

  getGuides().forEach((x) => {
    const guide = document.createElement('div');
    guide.className = 'pulse-editor-guide';
    guide.style.left = `${x}px`;
    nodes.push(guide);
  });

  let number = 0;
  model.forEach(({
    el, index, box, points,
  }) => {
    const boundary = document.createElement('div');
    boundary.className = 'pulse-editor-boundary';
    boundary.style.top = `${box.y}px`;
    boundary.textContent = getSectionName(el, index);
    nodes.push(boundary);

    points.forEach((point, pointIndex) => {
      const { x, y } = toPixels(box, point);
      number += 1;
      const handle = document.createElement('button');
      handle.type = 'button';
      handle.className = 'pulse-editor-handle';
      handle.style.left = `${x}px`;
      handle.style.top = `${y}px`;
      handle.textContent = number;
      handle.title = 'Drag to move (Alt: no snapping), double-click to remove';
      handle.dataset.section = index;
      handle.dataset.point = pointIndex;
      nodes.push(handle);
    });
  });

  layer.style.height = `${origin.height}px`;
  layer.replaceChildren(...nodes);
}

function refresh() {
  if (!enabled) return;
  const model = getModel();
  updateLayer(model);
  updatePanel(model);
}

function onPointerDown(event) {
  event.stopPropagation();
  const handle = event.target.closest('.pulse-editor-handle');
  if (!handle) return;
  event.preventDefault();
  handle.setPointerCapture(event.pointerId);
  dragging = {
    handle,
    section: Number(handle.dataset.section),
    point: Number(handle.dataset.point),
    moved: false,
  };
}

function onPointerMove(event) {
  if (!dragging) return;
  dragging.moved = true;
  const model = getModel();
  const section = model[dragging.section];
  const position = getLocalPosition(event);
  position.x = snapX(position.x, event.altKey);

  section.points[dragging.point] = toPercent(section.box, position);
  writePoints(section.el, section.points);
  dragging.handle.style.left = `${position.x}px`;
  dragging.handle.style.top = `${position.y}px`;
  // only redraw the line while dragging; the arrow animation is rebuilt on drop
  api.drawPath();
}

function onPointerUp(event) {
  if (!dragging) return;
  // a plain click keeps the handles in place, so a double-click can remove the point
  if (!dragging.moved) {
    dragging = null;
    return;
  }
  const model = getModel();
  const from = model[dragging.section];
  const position = getLocalPosition(event);
  position.x = snapX(position.x, event.altKey);
  const to = findSectionAt(model, position.y);
  const { point } = dragging;

  // a point dropped in another section moves to that section
  if (to !== from) {
    from.points.splice(point, 1);
    writePoints(from.el, from.points);
    insertPoint(model, to.index, toPercent(to.box, position));
    writePoints(to.el, to.points);
  }

  dragging = null;
  api.render();
  refresh();
}

function onClick(event) {
  event.stopPropagation();
  event.preventDefault();
  if (event.target.closest('.pulse-editor-handle')) return;

  const model = getModel();
  const position = getLocalPosition(event);
  position.x = snapX(position.x, event.altKey);
  const section = findSectionAt(model, position.y);
  insertPoint(model, section.index, toPercent(section.box, position));
  writePoints(section.el, section.points);
  api.render();
  refresh();
}

function onDoubleClick(event) {
  event.stopPropagation();
  event.preventDefault();
  const handle = event.target.closest('.pulse-editor-handle');
  if (!handle) return;

  const model = getModel();
  const section = model[Number(handle.dataset.section)];
  section.points.splice(Number(handle.dataset.point), 1);
  writePoints(section.el, section.points);
  api.render();
  refresh();
}

function setEnabled(value) {
  enabled = value;
  layer.hidden = !enabled;
  panel.classList.toggle('is-enabled', enabled);
  panel.querySelector('.pulse-editor-toggle').textContent = enabled ? 'Done' : 'Edit path';
  panel.querySelector('.pulse-editor-toggle').setAttribute('aria-pressed', String(enabled));
  refresh();
}

function createPanel() {
  panel = document.createElement('aside');
  panel.className = 'pulse-editor-panel';
  panel.setAttribute('aria-label', 'Pulse path editor');

  const header = document.createElement('div');
  header.className = 'pulse-editor-header';
  const title = document.createElement('strong');
  title.textContent = 'Pulse path';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'pulse-editor-toggle';
  toggle.addEventListener('click', () => setEnabled(!enabled));
  header.append(title, toggle);

  const mode = document.createElement('p');
  mode.className = 'pulse-editor-mode';
  const help = document.createElement('p');
  help.className = 'pulse-editor-help';
  help.textContent = 'Click to add, drag to move (Alt: no snap), double-click to remove.';

  list = document.createElement('ol');
  list.className = 'pulse-editor-list';

  panel.append(header, mode, help, list);
  // keep clicks in the panel from selecting components in Universal Editor
  panel.addEventListener('click', (event) => event.stopPropagation());
  document.body.append(panel);
}

function createLayer() {
  layer = document.createElement('div');
  layer.className = 'pulse-editor-layer';
  layer.addEventListener('pointerdown', onPointerDown);
  layer.addEventListener('pointermove', onPointerMove);
  layer.addEventListener('pointerup', onPointerUp);
  layer.addEventListener('click', onClick);
  layer.addEventListener('dblclick', onDoubleClick);
  api.main.append(layer);
}

function watch() {
  new ResizeObserver(() => window.requestAnimationFrame(refresh)).observe(api.main);
  api.desktopQuery.addEventListener('change', refresh);
  // sections re-rendered by Universal Editor (e.g. after pasting a value)
  new MutationObserver(() => {
    if (ignoreMutations || dragging) return;
    scheduleRender();
    window.requestAnimationFrame(refresh);
  }).observe(api.main, {
    childList: true,
    subtree: true,
    attributeFilter: ['data-animation-point', 'data-animation-point-mobile'],
  });
}

/**
 * Starts the editor. Safe to call again when the block is re-decorated.
 * @param {object} options
 * @param {Element} options.main The main element
 * @param {MediaQueryList} options.desktopQuery Desktop breakpoint query
 * @param {Function} options.getSectionBox Box the section percentages refer to
 * @param {Function} options.drawPath Redraws the line only
 * @param {Function} options.render Redraws the line and rebuilds the animation
 */
export default async function initEditor(options) {
  const firstRun = !api;
  api = options;
  if (!firstRun) {
    if (!layer.isConnected) api.main.append(layer);
    refresh();
    return;
  }

  await loadCSS(`${window.hlx.codeBasePath}/blocks/pulse-animation/pulse-editor.css`);
  createLayer();
  createPanel();
  watch();
  setEnabled(false);
}

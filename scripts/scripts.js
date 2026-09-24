import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  getMetadata,
  loadSections,
  loadCSS,
  buildBlock,
} from './aem.js';

/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */

//  tablist start
function buildTabs(main) {
  function getTabLabel(section) {
    return section?.dataset?.tabLabel || null;
    // const metadataBlock = section.querySelector('.section-metadata');
    // const metadata = metadataBlock ? readBlockConfig(metadataBlock) : {};
    // return metadata['tab-label'];
  }

  for (let i = 0; i < main.children.length; i += 1) {
    const section = main.children[i];
    const tabLabel = getTabLabel(section);
    const previousSection = i > 0 ? main.children[i - 1] : null;
    const previousTabLabel = previousSection
      ? getTabLabel(previousSection)
      : null;

    if (tabLabel && !previousTabLabel) {
      // found first tab panel of a list of consecutive tab panels
      // create a tab list block if non exists as last child
      let previousBlock = previousSection?.lastElementChild;
      if (previousBlock?.matches('.section-metadata')) { previousBlock = previousBlock.previousElementSibling; }
      if (!previousBlock?.matches('.tab-list')) {
        const tabListBlock = document.createElement('div');
        tabListBlock.className = 'tab-list block';
        const newSection = document.createElement('div');
        newSection.className = 'section';
        newSection.appendChild(tabListBlock);
        section.before(newSection);
      }
    }
  }
}
//  tablist end
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to?.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

function buildBreadcrumbBlock(main) {
  if (
    (window.location.pathname !== '/'
      && window.isErrorPage !== true
      && getMetadata('breadcrumbs_show').includes('true'))
    || getMetadata('breadcrumb').includes('true')
  ) {
    const sections = document.createElement('div');
    sections.append(buildBlock('breadcrumb', { elems: [] }));
    main.prepend(sections);
  }
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // TODO: add auto block, if needed
    buildTabs(main);
    // document.querySelector('main > .breadcrumb-container');
    if (!document.querySelector('main > .breadcrumb-container')) {
      buildBreadcrumbBlock(main);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
export function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Decorates hero-banner sections: wraps the meta icon + trailing text into a
 * `.hero-badge` pill and wires up the "Get Lumpsum Return" style dropdown lists.
 * @param {Element} main The main element
 */
function decorateHeroBanner(main) {
  main.querySelectorAll('.section.hero-banner').forEach((section) => {
    const wrapper = section.querySelector(':scope > .default-content-wrapper') || section;

    // 1. Badge Pill Handling
    const metaIcon = wrapper.querySelector(':scope > p > .icon');
    if (metaIcon) {
      const p = metaIcon.closest('p');
      const badge = document.createElement('span');
      badge.className = 'hero-badge';
      while (metaIcon.nextSibling) badge.append(metaIcon.nextSibling);
      badge.prepend(metaIcon);
      p.append(badge);
    }

    // 2. Dropdown Lists Handling
    const dropdowns = [...wrapper.querySelectorAll(':scope > ul > li')]
      .filter((li) => li.querySelector(':scope > ul'));
    if (!dropdowns.length) return;

    const closeAll = (except) => {
      dropdowns.forEach((li) => {
        if (li === except) return;
        li.classList.remove('is-open');
        const trigger = li.querySelector('.hero-dropdown-trigger');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      });
    };

    dropdowns.forEach((li) => {
      const panel = li.querySelector(':scope > ul');
      if (!panel) return;

      li.classList.add('hero-dropdown');
      panel.classList.add('hero-dropdown-panel');

      // Find the trigger content (link or paragraph)
      const existingTriggerNode = li.querySelector(':scope > a, :scope > p');
      const triggerP = document.createElement('p');
      triggerP.className = 'hero-dropdown-trigger';
      triggerP.setAttribute('role', 'button');
      triggerP.setAttribute('tabindex', '0');
      triggerP.setAttribute('aria-expanded', 'false');

      // Preserve label text
      const labelText = existingTriggerNode
        ? existingTriggerNode.textContent.trim()
        : li.firstChild.textContent.trim();
      triggerP.textContent = labelText;

      // Add Chevron Icon Span
      const chevronIcon = document.createElement('span');
      chevronIcon.className = 'icon icon-chevron-down';
      triggerP.appendChild(chevronIcon);

      // Replace old trigger element with new interactive trigger paragraph
      if (existingTriggerNode) {
        existingTriggerNode.replaceWith(triggerP);
      } else {
        li.insertBefore(triggerP, panel);
      }

      // 3. Decorate Sub-Menu Items with Icons
      [...panel.querySelectorAll(':scope > li')].forEach((subLi, index) => {
        const link = subLi.querySelector('a');
        if (link) {
          const text = link.textContent.trim();
          const { href } = link;
          const iconName = index === 0 ? 'economic-crisis' : `economic-crisis${index}`;
          subLi.innerHTML = `<a href="${href}"><span class="icon icon-${iconName}"></span>${text}</a>`;
        }
      });

      // 4. Interaction Logic
      const toggle = () => {
        const isOpen = !li.classList.contains('is-open');
        closeAll(li);
        li.classList.toggle('is-open', isOpen);
        triggerP.setAttribute('aria-expanded', String(isOpen));
      };

      triggerP.addEventListener('click', (e) => {
        e.stopPropagation();
        toggle();
      });

      triggerP.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        } else if (e.key === 'Escape') {
          closeAll();
        }
      });
    });

    // Close when clicking outside section
    document.addEventListener('click', (e) => {
      if (!section.contains(e.target)) closeAll();
    });

    // Render icon SVG graphics dynamically
    decorateIcons(section);
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
  decorateHeroBanner(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();

  // eslint-disable-next-line import/no-cycle
  const { initializeModalHandlers } = await import('../blocks/modal/modal.js');
  initializeModalHandlers();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadAutoForm(doc) {
  const anchors = [...doc.querySelectorAll('a')];
  anchors.forEach(async (anchor) => {
    if (anchor?.href?.includes('/forms/')) {
      loadCSS(
        `${window.hlx.codeBasePath}/blocks/form/form.css`,
      );
      const form = await import(
        `${window.hlx.codeBasePath}/blocks/form/form.js`
      );

      const wrapper = document.createElement('div');
      const anchorParent = anchor.parentElement;
      wrapper.classList.add('form', 'block');
      const submit = document.createElement('a');
      // EDS-019: derive submit URL from page metadata instead of hard-coding Singapore path
      const formSubmitUrl = `${window.template}/in/en/api.json`;
      submit.href = formSubmitUrl;
      wrapper.append(anchor);
      wrapper.append(submit);
      anchorParent.replaceWith(wrapper);
      await form.default(wrapper);
    }
  });
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  await loadAutoForm(document);
  loadDelayed();
}

/**
 * Creates and animates the decorative pulse route across the page.
 */
function initPulseAnimation() {
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
  glowPath.setAttribute('d', 'M172.002 49.3969C132.096 40.8638 61.9932 42.6426 26.1297 55.626L27.1652 35.258L26.0001 26.0004C68.2746 29.68 121.751 38.6515 172.002 49.3969Z');
  glowPath.setAttribute('fill', 'url(#pulse-gradient)');
  glowPath.setAttribute('filter', 'url(#pulse-glow)');
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
    headPath.setAttribute('d', pulsePath);
    const headPoint = path.getPointAtLength(headDistance);
    const previousHeadPoint = path.getPointAtLength(Math.max(0, headDistance - 1.5));
    const nextHeadPoint = path.getPointAtLength(Math.min(pathLength, headDistance + 1.5));
    const headAngle = Math.atan2(
      nextHeadPoint.y - previousHeadPoint.y,
      nextHeadPoint.x - previousHeadPoint.x,
    ) * (180 / Math.PI);
    glowPath.setAttribute(
      'transform',
      `translate(${headPoint.x} ${headPoint.y}) rotate(${headAngle}) translate(-172.002 -63.397)`,
    );
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
    // percentage height is unreliable on an absolutely positioned overlay
    // inside an auto-height <main>, so size the svg to explicit pixels
    svgContainer.style.height = `${height}px`;
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    path.setAttribute('d', getRoutePath(width, height));
    pathLength = path.getTotalLength();
    const isMobile = window.matchMedia('(max-width: 899px)').matches;
    const initialTargetY = Math.min(isMobile ? 360 : 620, height * 0.3);
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
    updatePulse(scrollMax > 0 ? Math.min(1, scrollY / scrollMax) : 0);
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

loadPage().then(() => {
  initPulseAnimation();
});

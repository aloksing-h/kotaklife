/* global gsap, MotionPathPlugin, ScrollTrigger */
import { loadScript } from '../../scripts/aem.js';

let gsapReady;

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

function createSvg() { // Removed block parameter
  const svgNamespace = 'http://www.w3.org/2000/svg';
  let svg = document.querySelector('#svg-overlay');
  if (svg) {
    return svg.querySelector('#path');
  }

  svg = document.createElementNS(svgNamespace, 'svg');
  svg.setAttribute('id', 'svg-overlay');
  const pathElement = document.createElementNS(svgNamespace, 'path');
  pathElement.setAttribute('id', 'path');
  pathElement.classList.add('testpath');
  svg.appendChild(pathElement);
  // APPEND TO MAIN, NOT THE BLOCK
  const main = document.querySelector('main');
  if (main) {
    main.classList.add('positioning-context'); // Ensure main is the positioning context
  }
  const secFour = document.querySelector(".pulse-animation-container");
  secFour.appendChild(svg);
  return pathElement;
}

function createArrowSVG(parent) {
  const svgWrapper = document.createElement('div');
  svgWrapper.classList.add('svg-wrapper');
  const svgNS = 'http://www.w3.org/2000/svg';

  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '-25 -25 50 50');
  svg.setAttribute('width', '40');
  svg.setAttribute('height', '40');
  svg.classList.add('arrow');

  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('fill', '#E74C3C');
  path.setAttribute('d', 'M-20,-8 L5,-8 L5,-18 L25,0 L5,18 L5,8 L-20,8 Z');

  svg.appendChild(path);
  svgWrapper.appendChild(svg);
  parent.appendChild(svgWrapper);

  return svg;
}

// 1. ONLY handles calculating coordinates and drawing the SVG line
function drawPath(block) {
  const sections = document.querySelectorAll('[data-animation-point]');
  const pathElement = createSvg(block);

  const points = [];

  sections.forEach((section) => {
    let data = section.getAttribute('data-animation-point');
    const dataMobile = section.getAttribute('data-animation-point-mobile');
    if (!data) return;
    if (window.innerWidth < 768 && dataMobile) {
      data = dataMobile;
    }
    const rawPoints = data.split('|');

    rawPoints.forEach((p) => {
      const coords = p.split(','); // Splits "50,10" into ["50", "10"]

      if (coords.length === 2) {
        const xPercent = parseFloat(coords[0].trim());
        const yPercent = parseFloat(coords[1].trim());

        const rect = section.getBoundingClientRect();

        // 1. Get the actual CSS margins from the browser
        const style = window.getComputedStyle(section);
        const marginTop = parseFloat(style.marginTop) || 0;
        const marginBottom = parseFloat(style.marginBottom) || 0;
        const marginLeft = parseFloat(style.marginLeft) || 0;
        const marginRight = parseFloat(style.marginRight) || 0;

        // 2. Combine element dimensions + margins into one giant box
        const totalWidth = rect.width + marginLeft + marginRight;
        const totalHeight = rect.height + marginTop + marginBottom;

        // 3. Find the TRUE start of this giant box (shifting back by the top/left margins)
        const boxStartX = rect.left + window.scrollX - marginLeft;
        const boxStartY = rect.top + window.scrollY - marginTop;

        // 4. Calculate absolute pixels based on the new massive total area
        const absoluteX = boxStartX + totalWidth * (xPercent / 100);
        const absoluteY = boxStartY + totalHeight * (yPercent / 100);

        points.push({ x: absoluteX, y: absoluteY });
      }
    });
  });

  // Generate the curve and draw it on the screen
  const rawPath = MotionPathPlugin.arrayToRawPath(points, { curviness: 1.5 });
  const svgString = MotionPathPlugin.rawPathToString(rawPath);
  pathElement.setAttribute('d', svgString);

  return pathElement;
}

// 2. ONLY handles the GSAP MotionPath and ScrollTrigger logic
function initAnimation(pathElement) {
  let currentDirection = 1;

  // Set up the scroll-linked animation
  gsap.to('.svg-wrapper', {
    motionPath: {
      path: pathElement,
      align: pathElement,
      alignOrigin: [0.5, 0.5],
      autoRotate: true,
    },
    scrollTrigger: {
      trigger: '.testpath',
      start: 'start center',
      end: () => 'bottom center',
      scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (self.direction !== currentDirection) {
          currentDirection = self.direction;
          gsap.to('.arrow', {
            scaleX: currentDirection === 1 ? 1 : -1,
            duration: 0.3,
            overwrite: 'auto',
          });
        }
      },
    },
    ease: 'none',
  });
}

// 3. Master function to run them in order
function setup(block) {
  const main = document.querySelector('main');
  createArrowSVG(main);
  const generatedPath = drawPath(block); // Step 1: Draw it
  initAnimation(generatedPath); // Step 2: Animate it
}

/**
 * loads and decorates the block
 * @param {Element} block The pulse-animation block
 */
export default async function decorate(block) {
  // const main = document.createElement('main');

  await loadGsap();

  window.addEventListener('lazyLoaded', () => {
    setup(block);
    ScrollTrigger.refresh();
    console.log('all sections loaded');
  });

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      drawPath(block);
      ScrollTrigger.refresh();
    }, 250);
  });
}

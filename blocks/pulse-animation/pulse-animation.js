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

// 1. ONLY handles calculating coordinates and drawing the SVG line
function drawPath() {
  const svg = document.createElement('svg');
  svg.setAttribute('id', 'svg-overlay');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const pathElement = document.createElement('path');
  pathElement.setAttribute('id', 'path');
  pathElement.classList.add('testpath');
  svg.appendChild(pathElement);
  document.body.appendChild(svg);
  const sections = document.querySelectorAll('[data-animation-point]');

  const points = [];

  // Loop through every section
  sections.forEach((section) => {
    const data = section.getAttribute('data-animation-point');
    if (!data) return; // Skip if section has no points

    // Split the data into individual X,Y string pairs
    const rawPoints = data.split('|');

    rawPoints.forEach((p) => {
      const coords = p.split(','); // Splits "50,10" into ["50", "10"]

      if (coords.length === 2) {
        // Convert the strings to numbers
        const xPercent = parseFloat(coords[0].trim());
        const yPercent = parseFloat(coords[1].trim());

        // Calculate exact absolute pixels based on the section's size and position
        const absoluteX = section.offsetLeft + section.offsetWidth * (xPercent / 100);
        const absoluteY = section.offsetTop + section.offsetHeight * (yPercent / 100);

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
  // Clear existing triggers and animations (crucial for window resizing)
  ScrollTrigger.getAll().forEach((t) => t.kill());
  gsap.killTweensOf('.pulse-animation');
  let currentDirection = 1;

  // Set up the scroll-linked animation
  gsap.to('.pulse-animation', {
    ease: 'none',
    motionPath: {
      path: pathElement,
      align: pathElement,
      alignOrigin: [0.5, 0.5],
      autoRotate: true,
    },
    scrollTrigger: {
      trigger: '#testpath',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      onUpdate: (self) => {
        if (self.direction !== currentDirection) {
          currentDirection = self.direction;
          gsap.to('.pulse-animation img', {
            scaleX: currentDirection === 1 ? 1 : -1,
            duration: 0.3,
            overwrite: true,
          });
        }
      },
    },
  });
}

// 3. Master function to run them in order
function setup() {
  const generatedPath = drawPath(); // Step 1: Draw it
  initAnimation(generatedPath); // Step 2: Animate it
}

/**
 * loads and decorates the block
 * @param {Element} block The pulse-animation block
 */
export default async function decorate(block) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  await loadGsap();
  setup(block);

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      setup(block);
    }, 250);
  });
}

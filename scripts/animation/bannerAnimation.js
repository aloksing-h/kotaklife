/* global gsap, Flip, ScrollTrigger, ScrollToPlugin */
import { loadScript } from '../aem.js';
import { SELECTORS } from './constant.js';

let isAnimating = false;
let currentIndex = 0;
const sections = [SELECTORS.AnimationSection1, SELECTORS.AnimationSection2];

let gsapReady;

// GSAP UMD bundles must load in order: core first, then its plugins.
async function loadGsap() {
    if (!gsapReady) {
        gsapReady = (async () => {
            await loadScript(`${window.hlx.codeBasePath}/scripts/thirdparty/gsap.min.js`);
            await Promise.all([
                loadScript(`${window.hlx.codeBasePath}/scripts/thirdparty/scrolltrigger.min.js`),
                loadScript(`${window.hlx.codeBasePath}/scripts/thirdparty/flip.min.js`),
                loadScript(`${window.hlx.codeBasePath}/scripts/thirdparty/scrollToPlugin.min.js`),
            ]);
            gsap.registerPlugin(Flip, ScrollTrigger, ScrollToPlugin);
        })();
    }
    return gsapReady;
}

function goToSection({
    index,
    videoWrapper,
    sec1VideoDest,
    sec2VideoDest,
    sec1Content,
    sec2Content,
    sec2Image,
}) {
    if (isAnimating) return;
    isAnimating = true;
    currentIndex = index;

    if (index === 1) {
        // --- SCROLLING DOWN TO SECTION 2 ---
        const timeline = gsap.timeline({
            onComplete: () => { isAnimating = false; }
        });

        timeline.to(sec1Content, {
            y: -100,
            opacity: 0,
            duration: 0.6,
            ease: 'power2.inOut',
        });

        timeline.to(videoWrapper, {
            '--mask-size': '54%',
            duration: 1,
            ease: 'power2.inOut',
        });

        timeline.addLabel('flipStart');

        timeline.call(() => {
            const state = Flip.getState(videoWrapper);
            sec2VideoDest.appendChild(videoWrapper);
            Flip.from(state, { duration: 1, ease: 'power2.inOut', absolute: true, zIndex: 9 });
        }, [], 'flipStart');

        timeline.to(window, {
            scrollTo: sections[1],
            duration: 1,
            ease: 'power2.inOut',
        }, 'flipStart');

        timeline.to([sec2Content, sec2Image], {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'power1.out',
        }, '>-0.4');
    } else {
        // --- SCROLLING UP TO SECTION 1 ---
        const timeline = gsap.timeline({
            onComplete: () => { isAnimating = false; }
        });

        timeline.addLabel('flipStart');

        timeline.to([sec2Content, sec2Image], {
            y: 100,
            opacity: 0,
            duration: 0.8,
            ease: 'power2.inOut',
        }, 'flipStart');

        timeline.call(() => {
            const state = Flip.getState(videoWrapper);
            sec1VideoDest.appendChild(videoWrapper);
            Flip.from(state, {
                duration: 1, ease: 'power2.inOut', absolute: true, zIndex: 9
            });
        }, [], 'flipStart');

        timeline.to(window, {
            scrollTo: sections[0],
            duration: 1,
            ease: 'power2.inOut',
        }, 'flipStart');

        timeline.to(videoWrapper, {
            '--mask-size': '1000%',
            duration: 1,
            ease: 'power2.inOut',
        });

        timeline.to(sec1Content, {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: 'power2.out',
        });
    }
}


await loadGsap();

const videoWrapper = document.querySelector(SELECTORS.VideoWrapper);
const sec1VideoDest = document.querySelector(SELECTORS.sec1VideoDest);
const sec2VideoDest = document.querySelector(SELECTORS.sec2VideoDest);
const sec1Content = document.querySelector(SELECTORS.sec1Content);
const sec2Image = document.querySelector(SELECTORS.sec2Image);
const sec2Content = document.querySelector(SELECTORS.sec2Content);
gsap.set([sec2Content, sec2Image], { y: 50, opacity: 0 });

const topObserver = ScrollTrigger.observe({
    target: window,
    type: 'wheel,touch,pointer',
    preventDefault: true,
    tolerance: 10,
    wheelSpeed: -1,

    onUp: () => {
        if (isAnimating) return;
        if (currentIndex === 0) {
            goToSection({
                index: 1,
                videoWrapper,
                sec1VideoDest,
                sec2VideoDest,
                sec1Content,
                sec2Content,
                sec2Image,
            });
        } else if (currentIndex === 1) {
            topObserver.disable();
        }
    },

    onDown: () => {
        if (isAnimating) return;
        if (currentIndex === 1) {
            goToSection({
                index: 0,
                videoWrapper,
                sec1VideoDest,
                sec2VideoDest,
                sec1Content,
                sec2Content,
                sec2Image,
            });
        }
    },
});

// --- Normal Scroll Handoff ---
ScrollTrigger.create({
    trigger: sections[1],
    // markers: true,
    start: 'top top',
    onLeaveBack: () => {
        if (!isAnimating) {
            topObserver.enable();
            goToSection({
                index: 0,
                videoWrapper,
                sec1VideoDest,
                sec2VideoDest,
                sec1Content,
                sec2Content,
                sec2Image,
            });
        }
    },
});

// Section heights shift after web fonts swap in and after the rest of the page's
// blocks finish decorating, which leaves the cached start/end trigger positions
// stale (e.g. "end" marker drifting below the section's real bottom edge).
document.fonts.ready.then(() => ScrollTrigger.refresh());
window.addEventListener('lazyLoaded', () => ScrollTrigger.refresh());
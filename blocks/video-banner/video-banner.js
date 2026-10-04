import { getRespectiveDomain } from '../../scripts/dom-helpers.js';

const isVideoEl = (el) => /\.(mp4|webm|ogg)(\?|$)/i.test(el?.querySelector('a')?.getAttribute('href') || '');
const isPictureEl = (el) => !!el?.querySelector('picture');

function scrollToLookingFor() {
  const target = document.querySelector('.looking-for');
  if (!target) return;

  const headerHeight = document.querySelector('header .nav-wrapper')?.offsetHeight || 0;
  const targetMarginTop = parseFloat(window.getComputedStyle(target).marginTop) || 0;
  const targetTop = target.getBoundingClientRect().top
    + window.scrollY
    - headerHeight
    - targetMarginTop;

  // Start smooth scroll first
  window.scrollTo({ top: targetTop, behavior: 'smooth' });

  // Delay class change to sync with scroll animation (transition happens during scroll)
  setTimeout(() => {
    const nav = document.querySelector('nav#nav');
    if (nav) {
      nav.classList.remove('grey-nav');
      nav.classList.add('white-nav');
    }
  }, 100); // 100ms delay so class change transitions smoothly during scroll
}

async function resolveMediaUrl(href) {
  try {
    const url = new URL(href, window.location.href);
    if (url.pathname.startsWith('/content/')) {
      let domain = await getRespectiveDomain();
      if (domain === true) {
        // Removed the trailing slash so it doesn't create "//content/dam..."
        domain = 'https://publish-p48457-e1275402.adobeaemcloud.com';
      }
      return domain + url.pathname;
    }
    return url.href;
  } catch {
    return href;
  }
}

// Mobile-only scroll indicator: vertical line with a circle that travels up the line on click.
function buildScrollIndicator(block) {
  if (block.querySelector('.scroll-indicator')) return;

  const indicator = document.createElement('div');
  indicator.className = 'scroll-indicator';
  indicator.innerHTML = '<button type="button" aria-label="Scroll to top"></button>';

  const button = indicator.querySelector('button');
  button.addEventListener('click', () => {
    button.classList.add('is-active');
    block.classList.add('video-banner-content-up');
    scrollToLookingFor();
  });

  block.append(indicator);
}

function resetScrollIndicatorOnReturn(block) {
  const button = block.querySelector('.scroll-indicator button');
  if (!button || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      button.classList.remove('is-active');
      block.classList.remove('video-banner-content-up');
    });
  }, { threshold: 0.4 });

  observer.observe(block);
}

export default async function decorate(block) {
  if (window.self !== window.top) {
    block.classList.add('is-editor');
  }
  if (block.classList.contains('autoplay')) {
    const rows = [...block.children];
    if (!rows.length) return;

    const desktopRow = rows[0];
    const mobileRow = rows[1];
    const contentRow = rows[2];

    const mediaWrapper = document.createElement('div');
    mediaWrapper.classList.add('video-banner-media');

    // Helper function to extract the URL or image from a row
    const getMediaData = async (row) => {
      const cell = row?.firstElementChild;
      if (!cell) return null;

      if (isVideoEl(cell)) {
        return { type: 'video', src: await resolveMediaUrl(cell.querySelector('a').href) };
      } if (isPictureEl(cell)) {
        return { type: 'image', el: cell.querySelector('picture') };
      }
      return null;
    };

    // Get data for both views (fallback to desktop if mobile row is empty)
    const desktopData = await getMediaData(desktopRow);
    const mobileData = (await getMediaData(mobileRow)) || desktopData;

    // Remove the authored rows from the DOM
    if (desktopRow) desktopRow.remove();
    if (mobileRow) mobileRow.remove();

    // Keep track of the currently rendered single tag
    let activeMediaEl = null;
    let playbackPaused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const syncPlaybackState = () => {
      const paused = activeMediaEl?.paused ?? true;
      mediaWrapper.setAttribute('aria-pressed', String(paused));
      mediaWrapper.title = paused ? 'Resume background animation' : 'Pause background animation';
    };

    const togglePlayback = () => {
      if (activeMediaEl?.tagName !== 'VIDEO') return;
      playbackPaused = !activeMediaEl.paused;
      if (playbackPaused) activeMediaEl.pause();
      else activeMediaEl.play().catch(() => {});
    };

    mediaWrapper.addEventListener('click', togglePlayback);
    mediaWrapper.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        togglePlayback();
      }
    });

    // Function to render or update the single media tag based on screen width
    const renderResponsiveMedia = () => {
    // Check if screen is mobile (less than or equal to 900px)
      const isMobile = window.matchMedia('(max-width: 900px)').matches;
      const currentData = isMobile ? mobileData : desktopData;

      if (!currentData) return;

      // Handle Image Fallback
      if (currentData.type === 'image') {
        mediaWrapper.removeAttribute('role');
        mediaWrapper.removeAttribute('tabindex');
        mediaWrapper.removeAttribute('aria-label');
        mediaWrapper.removeAttribute('aria-pressed');
        mediaWrapper.removeAttribute('title');
        if (activeMediaEl !== currentData.el) {
          if (activeMediaEl?.tagName === 'VIDEO') activeMediaEl.pause();
          mediaWrapper.innerHTML = ''; // clear wrapper
          mediaWrapper.appendChild(currentData.el);
          activeMediaEl = currentData.el;
        }
        return;
      }

      // Handle Video (The core requirement)
      if (currentData.type === 'video') {
        mediaWrapper.setAttribute('role', 'button');
        mediaWrapper.setAttribute('tabindex', '0');
        mediaWrapper.setAttribute('aria-label', 'Pause background animation');
        if (activeMediaEl && activeMediaEl.tagName === 'VIDEO') {
        // If the single video tag already exists, just update its source and reload
          if (activeMediaEl.getAttribute('src') !== currentData.src) {
            activeMediaEl.setAttribute('src', currentData.src);
            activeMediaEl.load(); // Forces the browser to load the new video src
            if (!playbackPaused && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
              activeMediaEl.play().catch(() => {});
            }
          }
        } else {
        // Create the single video tag for the first time
          mediaWrapper.innerHTML = ''; // clear wrapper
          const video = document.createElement('video');
          if (!playbackPaused && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            video.setAttribute('autoplay', '');
          }
          video.controls = false;
          video.addEventListener('play', syncPlaybackState);
          video.addEventListener('pause', syncPlaybackState);
          video.setAttribute('aria-label', 'Kotak Life background animation');
          video.setAttribute('loop', '');
          video.setAttribute('muted', '');
          video.muted = true;
          video.setAttribute('playsinline', '');
          video.setAttribute('webkit-playsinline', '');
          video.setAttribute('src', currentData.src);

          mediaWrapper.appendChild(video);
          activeMediaEl = video;
        }
        syncPlaybackState();
      }
    };

    // 1. Initial load
    renderResponsiveMedia();

    // 2. Listen for window resize to swap the video source if crossing 900px
    window.matchMedia('(max-width: 900px)').addEventListener('change', renderResponsiveMedia);

    // 3. Process Overlay Text
    if (contentRow) {
      contentRow.classList.add('video-banner-content');

      const lastParagraph = contentRow.querySelector('p:last-child');
      if (lastParagraph) {
        lastParagraph.addEventListener('click', () => {
          scrollToLookingFor();
        });
      }
    }

    // Insert media wrapper into the block
    block.prepend(mediaWrapper);
  }

  const revealDelay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 0;
  block.classList.add('video-banner-animate');
  window.setTimeout(() => {
    block.classList.add('video-banner-revealed');
  }, revealDelay);

  buildScrollIndicator(block);
  resetScrollIndicatorOnReturn(block);
}

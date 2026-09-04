import { getRespectiveDomain } from '../../scripts/dom-helpers.js';

const isVideoEl = (el) => /\.(mp4|webm|ogg)(\?|$)/i.test(el?.querySelector('a')?.getAttribute('href') || '');
const isPictureEl = (el) => !!el?.querySelector('picture');

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

export default async function decorate(block) {
  if(block.classList.contains('autoplay')){
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
    } else if (isPictureEl(cell)) {
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

  // Function to render or update the single media tag based on screen width
  const renderResponsiveMedia = () => {
    // Check if screen is mobile (less than or equal to 900px)
    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    const currentData = isMobile ? mobileData : desktopData;

    if (!currentData) return;

    // Handle Image Fallback
    if (currentData.type === 'image') {
      if (activeMediaEl !== currentData.el) {
        mediaWrapper.innerHTML = ''; // clear wrapper
        mediaWrapper.appendChild(currentData.el);
        activeMediaEl = currentData.el;
      }
      return;
    }

    // Handle Video (The core requirement)
    if (currentData.type === 'video') {
      if (activeMediaEl && activeMediaEl.tagName === 'VIDEO') {
        // If the single video tag already exists, just update its source and reload
        if (activeMediaEl.getAttribute('src') !== currentData.src) {
          activeMediaEl.setAttribute('src', currentData.src);
          activeMediaEl.load(); // Forces the browser to load the new video src
          activeMediaEl.play().catch(() => {}); // Ensure it autoplay continues
        }
      } else {
        // Create the single video tag for the first time
        mediaWrapper.innerHTML = ''; // clear wrapper
        const video = document.createElement('video');
        video.setAttribute('autoplay', '');
        video.setAttribute('loop', '');
        video.setAttribute('muted', '');
        video.muted = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.setAttribute('src', currentData.src);
        
        mediaWrapper.appendChild(video);
        activeMediaEl = video;
      }
    }
  };

  // 1. Initial load
  renderResponsiveMedia();

  // 2. Listen for window resize to swap the video source if crossing 900px
  window.matchMedia('(max-width: 900px)').addEventListener('change', renderResponsiveMedia);

  // 3. Process Overlay Text
  if (contentRow) {
    contentRow.classList.add('video-banner-content');
  }

  // Insert media wrapper into the block
  block.prepend(mediaWrapper);
  }  
  
}
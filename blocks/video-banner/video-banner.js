import { getRespectiveDomain } from '../../scripts/dom-helpers.js';

const isVideoEl = (el) => /\.(mp4|webm|ogg)(\?|$)/i.test(el?.querySelector('a')?.getAttribute('href') || '');
const isPictureEl = (el) => !!el?.querySelector('picture');

async function resolveMediaUrl(href) {
  try {
    const url = new URL(href, window.location.href);
    if (url.pathname.startsWith('/content/')) {
      let domain = await getRespectiveDomain();
      if (domain === true) {
        domain = 'https://publish-p48457-e1275402.adobeaemcloud.com/';
      }
      return domain + url.pathname;
    }
    return url.href;
  } catch {
    return href;
  }
}

// Reusable function to create media tags and apply specific class names
async function createMediaEl(mediaCell, className) {
  if (!mediaCell) return null;
  
  if (isVideoEl(mediaCell)) {
    const anchor = mediaCell.querySelector('a');
    const video = document.createElement('video');
    const src = await resolveMediaUrl(anchor.href);
    
    video.setAttribute('autoplay', '');
    video.setAttribute('loop', '');
    video.setAttribute('muted', '');
    video.muted = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.className = className; // 'hero-media-desktop' or 'hero-media-mobile'
    
    const source = document.createElement('source');
    source.setAttribute('src', src);
    source.setAttribute('type', 'video/mp4');
    
    video.appendChild(source);
    return video;
  } else if (isPictureEl(mediaCell)) {
    const picture = mediaCell.querySelector('picture');
    picture.className = className;
    return picture;
  }
  return null;
}

export default async function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  // Extract the 3 rows you authored
  const desktopRow = rows[0];
  const mobileRow = rows[1];
  const contentRow = rows[2];

  const mediaWrapper = document.createElement('div');
  mediaWrapper.classList.add('video-banner-media');

  // 1. Process Desktop Video
  if (desktopRow) {
    const desktopMedia = await createMediaEl(desktopRow.firstElementChild, 'hero-media-desktop');
    if (desktopMedia) mediaWrapper.appendChild(desktopMedia);
    desktopRow.remove();
  }

  // 2. Process Mobile Video
  if (mobileRow) {
    const mobileMedia = await createMediaEl(mobileRow.firstElementChild, 'hero-media-mobile');
    if (mobileMedia) mediaWrapper.appendChild(mobileMedia);
    mobileRow.remove();
  }

  // 3. Process Overlay Text
  if (contentRow) {
    contentRow.classList.add('video-banner-content');
  }

  // Insert media wrapper into the block
  block.prepend(mediaWrapper);
}
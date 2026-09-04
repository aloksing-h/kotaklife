/**
 * Checks if the element contains a valid video link.
 */
const isVideoEl = (el) =>
  /\.(mp4|webm|ogg)(\?|$)/i.test(
    el?.querySelector('a')?.getAttribute('href') || ''
  );

/**
 * Checks if the element contains an authored image.
 */
const isPictureEl = (el) => !!el?.querySelector('picture');

/**
 * Builds the <video> DOM element.
 */
function createVideoEl(href) {
  const video = document.createElement('video');
  
  // Standard banner video attributes
  video.setAttribute('autoplay', '');
  video.setAttribute('loop', '');
  video.setAttribute('muted', '');
  video.muted = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  
  const source = document.createElement('source');
  source.setAttribute('src', href);
  source.setAttribute('type', 'video/mp4');
  
  video.appendChild(source);
  return video;
}

/**
 * Video Banner block decorator.
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const mediaRow = rows[0];
  const mediaCell = mediaRow.firstElementChild;
  
  // Create a wrapper for our background media
  const mediaWrapper = document.createElement('div');
  mediaWrapper.classList.add('video-banner-media');

  // 1. Handle Video
  if (isVideoEl(mediaCell)) {
    const anchor = mediaCell.querySelector('a');
    const video = createVideoEl(anchor.href);
    mediaWrapper.appendChild(video);
  } 
  // 2. Handle Image Fallback
  else if (isPictureEl(mediaCell)) {
    const picture = mediaCell.querySelector('picture');
    mediaWrapper.appendChild(picture);
  }

  // Remove the authored media row so it doesn't duplicate in the DOM
  mediaRow.remove();

  // If there is a second row, treat it as overlay content
  const contentRow = block.children[0]; // now index 0 after removing mediaRow
  if (contentRow) {
    contentRow.classList.add('video-banner-content');
  }

  // Insert media at the very top of the block
  block.prepend(mediaWrapper);
}
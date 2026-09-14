const mobileQuery = window.matchMedia('(max-width: 767px)');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function getFieldNodes(block) {
  return Array.from(block.children).filter((child) => child.textContent.trim() || child.querySelector('a'));
}

function getVideoUrl(value) {
  if (!value) return '';
  if (value instanceof HTMLAnchorElement) return value.href;
  return value;
}

function getVideoSource(videoUrl, autoplay) {
  const video = document.createElement('video');
  video.setAttribute('playsinline', '');
  video.setAttribute('preload', autoplay ? 'auto' : 'metadata');

  if (autoplay) {
    video.setAttribute('autoplay', '');
    video.setAttribute('muted', '');
    video.setAttribute('loop', '');
  } else {
    video.setAttribute('controls', '');
  }

  const source = document.createElement('source');
  source.setAttribute('src', videoUrl);
  source.setAttribute('type', `video/${videoUrl.split('.').pop()}`);
  video.append(source);

  return video;
}

function getResponsiveVideoUrl(desktopVideo, mobileVideo) {
  if (mobileQuery.matches && mobileVideo) return mobileVideo;
  return desktopVideo || mobileVideo;
}

export default async function decorate(block) {
  const fields = getFieldNodes(block);
  const [desktopField, mobileField, titleField] = fields;
  const autoplay = block.classList.contains('autoplay') && !prefersReducedMotion.matches;
  const desktopVideo = getVideoUrl(desktopField?.querySelector('a'));
  const mobileVideo = getVideoUrl(mobileField?.querySelector('a'));
  const titleHtml = titleField?.innerHTML?.trim();
  const videoUrl = getResponsiveVideoUrl(desktopVideo, mobileVideo);

  block.textContent = '';
  block.dataset.embedLoaded = 'false';

  const wrapper = document.createElement('div');
  wrapper.className = 'video-banner-wrapper';

  if (titleHtml) {
    const title = document.createElement('div');
    title.className = 'video-banner-title';
    title.innerHTML = titleHtml;
    wrapper.append(title);
  }

  if (videoUrl) {
    const video = getVideoSource(videoUrl, autoplay);
    wrapper.append(video);
    video.addEventListener('loadedmetadata', () => {
      block.dataset.embedLoaded = 'true';
    });
  }

  block.append(wrapper);
  if (videoUrl) {
    block.dataset.embedLoaded = 'true';
  }
}

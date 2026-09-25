import { openModal } from '../modal/modal.js';
import { getRespectiveDomain } from '../../scripts/dom-helpers.js';

async function resolveMediaUrl(href) {
  try {
    const url = new URL(href, window.location.href);
    if (url.pathname.startsWith('/content/')) {
      let domain = await getRespectiveDomain();
      if (domain === true) {
        domain = 'https://publish-p48457-e1275402.adobeaemcloud.com';
      }
      return domain + url.pathname;
    }
    return url.href;
  } catch {
    return href;
  }
}

export default function decorate(block) {
  const items = [...block.children];

  items.forEach(async (row, index) => {
    row.classList.add('testimonial-item');

    row.setAttribute('tabindex', '0');
    row.setAttribute('role', 'button');
    row.setAttribute('aria-expanded', index === 0 ? 'true' : 'false');

    let modalUrl = null;

    const columns = [...row.children];
    if (columns.length >= 2) {
      const col1 = columns[0];
      const col2 = columns[1];

      col1.classList.add('testimonial-col-1');
      col2.classList.add('testimonial-col-2');

      const col1Elements = [...col1.children];
      if (col1Elements.length >= 1) col1Elements[0].classList.add('short-img-mob');
      if (col1Elements.length >= 2) col1Elements[1].classList.add('short-img-desk');

      const col2Elements = [...col2.children];
      if (col2Elements.length >= 1) col2Elements[0].classList.add('large-img-mob');
      if (col2Elements.length >= 2) col2Elements[1].classList.add('large-img-desk');
      
      if (col2Elements.length >= 3) {
        col2Elements[2].classList.add('video-source-wrapper');
        const VideoWrapper = col2Elements[2];
        const isVideoEl = (el) => /\.(mp4|webm|ogg)(\?|$)/i.test(el?.querySelector('a')?.getAttribute('href') || '');
        
        if (isVideoEl(VideoWrapper)) {
          const videoAnchor = VideoWrapper.querySelector('a');
          const videoSrc = await resolveMediaUrl(videoAnchor.href);

          const video = document.createElement('video');
          video.setAttribute('loop', '');
          video.setAttribute('muted', '');
          video.muted = true; 
          video.setAttribute('playsinline', '');
          video.setAttribute('webkit-playsinline', '');
          video.setAttribute('preload', 'auto'); // Force browser to buffer early
          video.setAttribute('src', videoSrc);
          
          VideoWrapper.innerHTML = '';
          VideoWrapper.appendChild(video);

          // Start playing ONLY when the browser has buffered enough data to prevent initial stuttering
          if (index === 0 && row.getAttribute('aria-expanded') === 'true') {
            video.addEventListener('canplay', () => {
              video.play().catch(() => {});
            }, { once: true });
          }
        }
      }

      if (col2Elements.length >= 4) {
        const videoBtnWrapper = col2Elements[3];
        videoBtnWrapper.classList.add('video-btn-wrapper');
        videoBtnWrapper.setAttribute('aria-label', 'Play video testimonial');
        videoBtnWrapper.setAttribute('role', 'button');
        videoBtnWrapper.setAttribute('tabindex', '0');

        const link = videoBtnWrapper.querySelector('a');

        if (link) {
          modalUrl = link.href;
          link.removeAttribute('href'); 
        }

        videoBtnWrapper.addEventListener('click', (e) => {
          e.stopPropagation(); 
          if (modalUrl) {
            openModal(modalUrl);
          }
        });

        videoBtnWrapper.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            if (modalUrl) {
              openModal(modalUrl);
            }
          }
        });
      }
    }

    const activateItem = () => {
      if (row.getAttribute('aria-expanded') === 'true') return;

      // Reset all items
      items.forEach((item) => {
        item.setAttribute('aria-expanded', 'false');
        const bgVideo = item.querySelector('video');
        if (bgVideo) {
          bgVideo.pause();
          bgVideo.currentTime = 0; // Reset video to start
        }
      });
      
      // Expand targeted item and play video immediately
      row.setAttribute('aria-expanded', 'true');
      const activeVideo = row.querySelector('video');
      if (activeVideo) {
        // If the video is completely ready, play it; otherwise wait for it to be ready
        if (activeVideo.readyState >= 3) {
          activeVideo.play().catch(() => {});
        } else {
          activeVideo.addEventListener('canplay', () => {
            activeVideo.play().catch(() => {});
          }, { once: true });
        }
      }
    };

    row.addEventListener('mouseenter', activateItem);
    row.addEventListener('focus', activateItem);
    row.addEventListener('click', () => activateItem());
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activateItem();
      }
    });
  });
}
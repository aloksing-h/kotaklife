import { openModal } from '../modal/modal.js';
import { getRespectiveDomain } from '../../scripts/dom-helpers.js';
// NEW: Import loadFragment to swap modal contents dynamically
import { loadFragment } from '../fragment/fragment.js'; 

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
  if (block.classList.contains('customer-say')) {
    let activeIndex = 0;
    let bullets = [];

    // Get only actual card items (never count pagination or non-element nodes)
    const getItems = () => [...block.children].filter(
      (el) => el.nodeType === 1 && !el.classList.contains('swiper-pagination'),
    );

    // Single source of truth: Switch active item, sync pagination, and manage video states
    const activateItem = (targetIndex) => {
      const items = getItems();
      if (items.length === 0) return;

      // Clamp index to valid bounds
      const validIndex = Math.max(0, Math.min(targetIndex, items.length - 1));
      activeIndex = validIndex;

      items.forEach((item, i) => {
        const isActive = i === validIndex;
        item.setAttribute('aria-expanded', isActive ? 'true' : 'false');

        // Manage Background Video Play/Pause State
        const bgVideo = item.querySelector('video');
        if (bgVideo) {
          if (isActive) {
            // Call play directly; iOS requires this to start buffering
            bgVideo.play().catch(() => {});
          } else {
            bgVideo.pause();
            bgVideo.currentTime = 0; // Reset video to start
          }
        }
      });

      // Update Pagination Bullets
      bullets.forEach((bullet, i) => {
        if (i === validIndex) {
          bullet.classList.add('swiper-pagination-bullet-active');
        } else {
          bullet.classList.remove('swiper-pagination-bullet-active');
        }
      });
    };

    // Decorate an individual card item (idempotent)
    const decorateItem = async (row, index) => {
      row.classList.add('testimonial-item');
      row.setAttribute('tabindex', '0');
      row.setAttribute('role', 'button');
      if (!row.hasAttribute('aria-expanded')) {
        row.setAttribute('aria-expanded', index === 0 ? 'true' : 'false');
      }

      if (row.dataset.decorated === 'true') {
        return; // Already decorated, avoid duplicate listeners or DOM restructure
      }
      row.dataset.decorated = 'true';

      let modalUrl = null;
      const columns = [...row.children];
      if (columns.length >= 2) {
        const col1 = columns[0];
        const col2 = columns[1];

        col1.classList.add('testimonial-col-1');
        col2.classList.add('testimonial-col-2');

        // Decorate Column 1: Short Images
        const col1Elements = [...col1.children];
        if (col1Elements.length >= 1) col1Elements[0].classList.add('short-img-mob');
        if (col1Elements.length >= 2) col1Elements[1].classList.add('short-img-desk');

        // Decorate Column 2: Large Images & Videos
        const col2Elements = [...col2.children];
        if (col2Elements.length >= 1) col2Elements[0].classList.add('large-img-mob');
        if (col2Elements.length >= 2) col2Elements[1].classList.add('large-img-desk');

        // Background Video Initialization
        if (col2Elements.length >= 3) {
          col2Elements[2].classList.add('video-source-wrapper');
          const VideoWrapper = col2Elements[2];
          const isVideoEl = (el) => /\.(mp4|webm|ogg)(\?|$)/i.test(el?.querySelector('a')?.getAttribute('href') || '');

          if (isVideoEl(VideoWrapper)) {
            const videoAnchor = VideoWrapper.querySelector('a');
            if (videoAnchor) {
              const videoSrc = await resolveMediaUrl(videoAnchor.href);

              const video = document.createElement('video');
              video.setAttribute('loop', '');
              video.setAttribute('muted', '');
              video.muted = true;
              video.setAttribute('playsinline', '');
              video.setAttribute('crossorigin', 'anonymous');
              video.setAttribute('webkit-playsinline', '');
              video.setAttribute('preload', 'auto');
              video.setAttribute('autoplay', ''); // Required for smoother iOS handling
              video.setAttribute('src', videoSrc);

              // Use existing image as a seamless loading poster
              const posterImg = col2.querySelector('.large-img-desk img') || col2.querySelector('.large-img-mob img');
              if (posterImg) {
                video.setAttribute('poster', posterImg.src);
              }

              // Add a class ONLY when the video has buffered and is actively playing
              video.addEventListener('playing', () => {
                row.classList.add('video-is-playing');
              });

              // Handle pausing resetting the visual state
              video.addEventListener('pause', () => {
                row.classList.remove('video-is-playing');
              });

              VideoWrapper.innerHTML = '';
              VideoWrapper.appendChild(video);

              // Trigger play if this item happens to be currently active
              if (index === activeIndex && row.getAttribute('aria-expanded') === 'true') {
                video.play().catch(() => {});
              } else {
                // Ensure inactive videos are paused despite the autoplay attribute
                video.pause();
              }
            }
          }
        }

        // Play Button & Modal Link Extraction
        if (col2Elements.length >= 4) {
          const videoBtnWrapper = col2Elements[3];
          videoBtnWrapper.classList.add('video-btn-wrapper');
          videoBtnWrapper.setAttribute('aria-label', 'Play video testimonial');
          videoBtnWrapper.setAttribute('role', 'button');
          videoBtnWrapper.setAttribute('tabindex', '0');

          const link = videoBtnWrapper.querySelector('a');
          if (link) {
            modalUrl = link.href;
            row.dataset.modalUrl = modalUrl;
            link.removeAttribute('href');
          }

          const triggerModal = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (modalUrl) {
              const allItems = getItems();
              const allUrls = allItems.map(item => item.dataset.modalUrl).filter(Boolean);
              
              // FIX: Use the exact row index instead of searching by URL.
              // This guarantees the arrows work properly even if multiple cards use the same video link.
              let currentIndex = allItems.indexOf(row);

              await openModal(allUrls[currentIndex]);

              if (allUrls.length > 1) {
                const dialog = document.querySelector('.modal.block dialog');
                if (!dialog || dialog.querySelector('.modal-nav')) return; // Avoid duplicates

                const dialogContent = dialog.querySelector('.modal-content');

                const modalBtnWrap = document.createElement('div');
                modalBtnWrap.className = 'modal-nav-wrap'

                const prevBtn = document.createElement('button');
                prevBtn.className = 'modal-nav prev';
                prevBtn.setAttribute('aria-label', 'Previous video');
                // prevBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>`;

                const nextBtn = document.createElement('button');
                nextBtn.className = 'modal-nav next';
                nextBtn.setAttribute('aria-label', 'Next video');
                // nextBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>`;

                // dialog.appendChild(prevBtn);
                // dialog.appendChild(nextBtn);

                modalBtnWrap.append(prevBtn, nextBtn);
                dialog.append(modalBtnWrap);

                const updateNav = () => {
                  prevBtn.disabled = currentIndex === 0;
                  nextBtn.disabled = currentIndex === allUrls.length - 1;
                };
                updateNav();

                const swapContent = async (newIndex) => {
                  currentIndex = newIndex;
                  updateNav();
                  
                  const newUrl = allUrls[currentIndex];
                  const path = newUrl.startsWith('http') ? new URL(newUrl, window.location).pathname : newUrl;
                  const fragment = await loadFragment(path);
                  
                  if (fragment && dialogContent) {
                    // Prevent memory leak: Properly destroy the old video stream before swapping
                    const oldVideo = dialogContent.querySelector('video');
                    if (oldVideo) {
                      oldVideo.pause();
                      oldVideo.removeAttribute('src'); 
                      oldVideo.load();
                    }

                    const closeBtn = dialogContent.querySelector('.close-button');
                    dialogContent.innerHTML = '';
                    if (closeBtn) dialogContent.appendChild(closeBtn); // Preserve close button
                    dialogContent.append(...fragment.childNodes);
                    dialogContent.scrollTop = 0;
                  }
                };

                prevBtn.addEventListener('click', (ev) => {
                  ev.stopPropagation();
                  if (currentIndex > 0) swapContent(currentIndex - 1);
                });

                nextBtn.addEventListener('click', (ev) => {
                  ev.stopPropagation();
                  if (currentIndex < allUrls.length - 1) swapContent(currentIndex + 1);
                });
              }
            }
          };

          videoBtnWrapper.addEventListener('click', triggerModal);
          videoBtnWrapper.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              triggerModal(e);
            }
          });
        }
      }

      // Hover & Focus switch active states
      if (window.matchMedia('(hover: hover)').matches) {
        row.addEventListener('mouseenter', () => {
          const items = getItems();
          const currentIndex = items.indexOf(row);
          if (currentIndex !== -1) activateItem(currentIndex);
        });
      }

      row.addEventListener('focus', () => {
        const items = getItems();
        const currentIndex = items.indexOf(row);
        if (currentIndex !== -1) activateItem(currentIndex);
      });

      // Click handler for the row
      row.addEventListener('click', () => {
        const items = getItems();
        const currentIndex = items.indexOf(row);
        if (currentIndex !== -1) activateItem(currentIndex);
      });

      // Keyboard support
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const items = getItems();
          const currentIndex = items.indexOf(row);
          if (currentIndex !== -1) activateItem(currentIndex);
        }
      });
    };

    // Rebuild pagination dynamically to always match the exact card count
    const syncPagination = () => {
      const items = getItems();
      let pagination = block.querySelector(':scope > .swiper-pagination');

      if (items.length <= 1) {
        if (pagination) pagination.remove();
        bullets = [];
        if (items.length === 1) {
          items[0].setAttribute('aria-expanded', 'true');
        }
        return;
      }

      if (!pagination) {
        pagination = document.createElement('div');
        pagination.className = 'swiper-pagination';
        block.appendChild(pagination);
      }

      // Clear existing bullets and regenerate to match current items.length
      pagination.innerHTML = '';
      bullets = items.map((_, index) => {
        const bullet = document.createElement('span');
        bullet.className = `swiper-pagination-bullet${index === activeIndex ? ' swiper-pagination-bullet-active' : ''}`;
        bullet.setAttribute('role', 'button');
        bullet.setAttribute('tabindex', '0');
        bullet.setAttribute('aria-label', `Go to slide ${index + 1}`);

        bullet.addEventListener('click', (e) => {
          e.stopPropagation();
          activateItem(index);
        });

        bullet.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            activateItem(index);
          }
        });

        pagination.appendChild(bullet);
        return bullet;
      });

      activateItem(activeIndex);
    };

    // Initial decoration of all cards
    const items = getItems();
    items.forEach((row, index) => {
      decorateItem(row, index);
    });
    syncPagination();

    // Watch for any cards added or removed dynamically (Universal Editor, DOM patch, or scripts)
    const observer = new MutationObserver((mutations) => {
      let cardCountChanged = false;
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && !node.classList.contains('swiper-pagination')) {
            cardCountChanged = true;
          }
        });
        mutation.removedNodes.forEach((node) => {
          if (node.nodeType === 1 && !node.classList.contains('swiper-pagination')) {
            cardCountChanged = true;
          }
        });
      });

      if (cardCountChanged) {
        const currentItems = getItems();
        currentItems.forEach((row, index) => {
          decorateItem(row, index);
        });
        // Ensure activeIndex is still within bounds
        if (activeIndex >= currentItems.length) {
          activeIndex = Math.max(0, currentItems.length - 1);
        }
        syncPagination();
      }
    });

    observer.observe(block, { childList: true });

    // Touch swipe support on mobile
    let touchStartX = 0;
    block.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    block.addEventListener('touchend', (e) => {
      const currentItems = getItems();
      if (currentItems.length <= 1) return;
      const touchEndX = e.changedTouches[0].screenX;
      const diffX = touchStartX - touchEndX;
      if (Math.abs(diffX) > 40) {
        if (diffX > 0 && activeIndex < currentItems.length - 1) {
          activateItem(activeIndex + 1);
        } else if (diffX < 0 && activeIndex > 0) {
          activateItem(activeIndex - 1);
        }
      }
    }, { passive: true });
  }
}

// eslint-disable-next-line import/no-cycle
import { loadFragment } from '../fragment/fragment.js';
import {
  buildBlock, decorateBlock, loadBlock, loadCSS,
} from '../../scripts/aem.js';

// Store initial modal content globally so it can be reset
let initialModalContent = null;

/*
  This is not a traditional block, so there is no decorate function.
  Instead, links to a /modals/ path are automatically transformed into a modal.
  Other blocks can also use the createModal() and openModal() functions.
*/

export default async function decorate(block) {
  // Store a copy of the initial modal content (default-content-wrapper)
  const defaultContentWrapper = block.querySelector('.default-content-wrapper');
  if (defaultContentWrapper) {
    initialModalContent = defaultContentWrapper.cloneNode(true);
  }

  // Clear the modal block initially
  block.innerHTML = '';

  // Check if desk-hamburger class is present (for desktop hamburger modal)
  const hasDeskhHamburgerClass = block.classList.contains('desk-hamburger');

  // Only re-append initial content if NOT opening from desk-hamburger
  // For desk-hamburger, content will be prepended later, so keep block empty until then
  if (!hasDeskhHamburgerClass && initialModalContent) {
    block.appendChild(initialModalContent.cloneNode(true));
  }
}

export async function createModal(contentNodes) {
  await loadCSS(`${window.hlx.codeBasePath}/blocks/modal/modal.css`);
  const dialog = document.createElement('dialog');
  const dialogContent = document.createElement('div');
  dialogContent.classList.add('modal-content');
  dialogContent.append(...contentNodes);
  dialog.append(dialogContent);

  const closeButton = document.createElement('button');
  closeButton.classList.add('close-button');
  closeButton.setAttribute('aria-label', 'Close');
  closeButton.type = 'button';
  closeButton.innerHTML = '<span class="icon icon-close"></span>';
  closeButton.addEventListener('click', () => dialog.close());
  // dialog.prepend(closeButton);
  dialogContent.prepend(closeButton);

  const block = buildBlock('modal', '');
  document.querySelector('main').append(block);
  decorateBlock(block);
  await loadBlock(block);

  // close on click outside the dialog
  dialog.addEventListener('click', (e) => {
    const {
      left, right, top, bottom,
    } = dialog.getBoundingClientRect();
    const { clientX, clientY } = e;
    if (clientX < left || clientX > right || clientY < top || clientY > bottom) {
      dialog.close();
    }
  });

  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    block.remove();
  });

  block.innerHTML = '';
  block.append(dialog);

  return {
    block,
    showModal: () => {
      dialog.showModal();
      // reset scroll position
      setTimeout(() => { dialogContent.scrollTop = 0; }, 0);
      document.body.classList.add('modal-open');
    },
  };
}

export async function openModal(fragmentUrl) {
  const path = fragmentUrl.startsWith('http')
    ? new URL(fragmentUrl, window.location).pathname
    : fragmentUrl;

  const fragment = await loadFragment(path);
  const { showModal } = await createModal(fragment.childNodes);
  showModal();
}

export function initializeModalHandlers() {
  document.body.addEventListener('click', async (e) => {
    const link = e.target.closest('a');
    if (!link || !link.href) return;

    // Check if it's a link to a modal fragment
    const isThankYouPopupLink = /thank[-_\s]?you[-_\s]?popup/i.test(link.href);
    if (link.href.includes('/modals/') || isThankYouPopupLink) {
      e.preventDefault();
      await openModal(link.href);
    }
  });
}

/**
 * Prepare and show desk-hamburger modal with proper timing to avoid visual jerk
 * This should be called after all content (nav-wrapper + initial content) is added to the section
 * @param {Element} modalBlock The modal block element
 */
export function setupDeskhHamburgerModal(modalBlock) {
  if (!modalBlock) return { clearAndShow: () => {} };

  return {
    clearAndShow: () => {
      // Use setTimeout to ensure all DOM updates in the section are complete before showing modal
      setTimeout(() => {
        // Get the section element with all the content
        const modalSection = modalBlock.querySelector('.section');
        if (!modalSection) return;

        // Get or create the dialog element
        let dialog = modalBlock.querySelector('dialog');

        if (!dialog) {
          // Create dialog structure if it doesn't exist
          dialog = document.createElement('dialog');
          const dialogContent = document.createElement('div');
          dialogContent.classList.add('modal-content');

          // Create close button
          const closeButton = document.createElement('button');
          closeButton.classList.add('close-button');
          closeButton.setAttribute('aria-label', 'Close');
          closeButton.type = 'button';
          closeButton.innerHTML = '<span class="icon icon-close"></span>';

          // Add close event listeners
          closeButton.addEventListener('click', () => dialog.close());
          dialog.addEventListener('close', () => {
            document.body.classList.remove('modal-open');
            modalBlock.remove();
          });

          // Close on click outside dialog
          dialog.addEventListener('click', (e) => {
            const {
              left, right, top, bottom,
            } = dialog.getBoundingClientRect();
            const { clientX, clientY } = e;
            if (clientX < left || clientX > right || clientY < top || clientY > bottom) {
              dialog.close();
            }
          });

          // Add close button to dialog content
          dialogContent.appendChild(closeButton);
          dialog.appendChild(dialogContent);

          // Clear modal block and add dialog
          modalBlock.innerHTML = '';
          modalBlock.appendChild(dialog);
        }

        // Move section content into dialog-content
        const dialogContent = dialog.querySelector('.modal-content');
        if (dialogContent && modalSection) {
          // Keep close button at the top
          const closeButton = dialogContent.querySelector('.close-button');
          dialogContent.innerHTML = '';
          if (closeButton) {
            dialogContent.appendChild(closeButton);
          }
          // Append the section to modal-content
          dialogContent.appendChild(modalSection);
        }

        // Show modal
        dialog.showModal();
        if (dialogContent) {
          dialogContent.scrollTop = 0;
        }
        document.body.classList.add('modal-open');
      }, 0);
    },
  };
}

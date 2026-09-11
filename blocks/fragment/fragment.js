/*
 * Fragment Block
 * Include content on a page as a fragment.
 * https://www.aem.live/developer/block-collection/fragment
 */

// eslint-disable-next-line import/no-cycle
import {
  decorateMain,
} from '../../scripts/scripts.js';

import {
  loadSections,
} from '../../scripts/aem.js';

/**
 * Loads a fragment.
 * @param {string} path The path to the fragment
 * @returns {HTMLElement} The root element of the fragment
 */
export async function loadFragment(path) {
  if (path && path.startsWith('/') && !path.startsWith('//')) {
    try {
      const fragmentUrl = `${path}.plain.html`;
      // eslint-disable-next-line no-console
      console.log(`Loading fragment from: ${fragmentUrl}`);
      
      const resp = await fetch(fragmentUrl);
      if (resp.ok) {
        const html = await resp.text();
        // eslint-disable-next-line no-console
        console.log('Fragment HTML loaded:', html.substring(0, 200));
        
        const main = document.createElement('main');
        main.innerHTML = html;

        // reset base path for media to fragment base
        const resetAttributeBase = (tag, attr) => {
          main.querySelectorAll(`${tag}[${attr}^="./media_"]`).forEach((elem) => {
            const oldAttr = elem.getAttribute(attr);
            elem[attr] = new URL(elem.getAttribute(attr), new URL(path, window.location)).href;
            // eslint-disable-next-line no-console
            console.log(`Updated ${tag} ${attr}: ${oldAttr} -> ${elem[attr]}`);
          });
        };
        resetAttributeBase('img', 'src');
        resetAttributeBase('source', 'srcset');

        // eslint-disable-next-line no-console
        console.log('Before decorateMain, main has children:', main.children.length);
        decorateMain(main);
        // eslint-disable-next-line no-console
        console.log('After decorateMain, main has children:', main.children.length);
        
        await loadSections(main);
        // eslint-disable-next-line no-console
        console.log('After loadSections, main has children:', main.children.length);
        
        return main;
      }
      // eslint-disable-next-line no-console
      console.warn(`Fragment not found (HTTP ${resp.status}): ${fragmentUrl}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error loading fragment from ${path}:`, error);
    }
  } else {
    // eslint-disable-next-line no-console
    console.warn(`Invalid fragment path (must start with /): ${path}`);
  }
  return null;
}

export default async function decorate(block) {
  const link = block.querySelector('a');
  if (!link) {
    // eslint-disable-next-line no-console
    console.warn('Fragment block: No link found in block');
    return;
  }
  const path = link.getAttribute('href');
  if (!path) {
    // eslint-disable-next-line no-console
    console.warn('Fragment block: Link has no href attribute');
    return;
  }
  
  // eslint-disable-next-line no-console
  console.log('Fragment block decorate called with path:', path);
  
  const fragment = await loadFragment(path);
  if (fragment) {
    // eslint-disable-next-line no-console
    console.log('Fragment loaded successfully, childNodes:', fragment.childNodes.length);
    // Replace block contents with fragment's child elements
    const childNodes = [...fragment.childNodes];
    block.replaceChildren(...childNodes);
    // eslint-disable-next-line no-console
    console.log('Block replaced with fragment children');
  } else {
    // eslint-disable-next-line no-console
    console.warn(`Failed to load fragment from: ${path}`);
  }
}

import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */

function addLayerClasses(element, classNameMap, depth = 1) {
  if (!element || !element.children) return;
  const className = classNameMap[depth] || `level-${depth}`;
  Array.from(element.children).forEach((child, index) => {
    child.classList.add(className);
    child.classList.add(`${className}-${index + 1}`);
    addLayerClasses(child, classNameMap, depth + 1);
  });
}

export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  block.append(footer);

  const footerAcrdn = block.querySelectorAll('.mob-accordion .accordion-item-body-content');
  if (footerAcrdn) {
    footerAcrdn.forEach((acrdn) => {
      addLayerClasses(acrdn, {
        1: 'acrdn-list',
        2: 'acrdn-item',
        3: 'acrdn-child',
        4: 'acrdn-inner',
        5: 'acrdn-link',
      });
    });
  }

  // Apply layer classes to social section
  const footerSocialMain = block.querySelector('.section:nth-child(2)');
  footerSocialMain.classList.add('footer-social')
  const footerSocial = block.querySelector('.section:nth-child(2) .default-content-wrapper');
  if (footerSocial) {
    addLayerClasses(footerSocial, {
      1: 'list-item',
      2: 'list-inner',
      3: 'inner-child',
      4: 'inner-item',
      5: 'item',
      6: 'item-child',
    });
  }

  const footerCaution = block.querySelector('.section:nth-child(3)');
  footerCaution.classList.add('caution-accordion');

  const footerImpLinkMain = block.querySelector('.section:nth-child(4)');
  footerImpLinkMain.classList.add('footer-imp-links');
  const footerImpLink = block.querySelector('.section:nth-child(4) .default-content-wrapper');
  if (footerImpLink) {
    addLayerClasses(footerImpLink, {
      1: 'imp-txt',
      2: 'link-list',
      3: 'link-item',
    });
  }

   const footerLogo = block.querySelector('.section:nth-child(5)');
  footerLogo.classList.add('footer-logo');
}

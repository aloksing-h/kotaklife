const functionalIconLabels = {
  'search-black': 'Search',
  'search-white': 'Search',
  'call-black': 'Contact options',
  'call-white': 'Contact options',
  'hamburger-black-desktop': 'Open navigation menu',
  'hamburger-white-desktop': 'Open navigation menu',
  'apple-store': 'Download on the App Store',
  'play-store': 'Get it on Google Play',
  'blank-fb': 'Facebook',
  'filled-fb': 'Facebook',
  'blank-x': 'X',
  'filled-x': 'X',
  'blank-ig': 'Instagram',
  'filled-ig': 'Instagram',
  'blank-yt': 'YouTube',
  'filled-yt': 'YouTube',
  'blank-in': 'LinkedIn',
  'filled-in': 'LinkedIn',
  'videoplay-Button': 'Play customer testimonial',
};

export function addMissingImageAlt(root = document) {
  const images = [...root.querySelectorAll('img')];
  if (root.matches?.('img')) images.unshift(root);

  const unresolved = [];
  images.forEach((image) => {
    if (image.getAttribute('alt')?.trim()) return;
    const iconLabel = functionalIconLabels[image.dataset.iconName];
    const action = image.closest('a, button, [role="button"]');
    if (iconLabel && action && !action.textContent.trim()
      && !action.hasAttribute('aria-label') && !action.hasAttribute('aria-labelledby')) {
      action.setAttribute('aria-label', iconLabel);
    }
    const decorative = image.matches('[data-decorative="true"], [role="presentation"], [role="none"]')
      || image.closest('[aria-hidden="true"]');
    if (decorative) {
      if (!image.hasAttribute('alt')) image.setAttribute('alt', '');
      return;
    }

    const labelledBy = (image.getAttribute('aria-labelledby') || '')
      .split(/\s+/)
      .filter(Boolean)
      .map((id) => image.ownerDocument.getElementById(id)?.textContent.trim() || '')
      .filter(Boolean)
      .join(' ');
    const alt = [
      image.getAttribute('data-alt'),
      labelledBy,
      image.getAttribute('aria-label'),
      image.getAttribute('title'),
      functionalIconLabels[image.dataset.iconName],
    ].find((value) => value?.trim());

    if (alt) image.setAttribute('alt', alt.trim());
    else unresolved.push(image);
  });

  return unresolved;
}

export function observeMissingImageAlt(root = document) {
  addMissingImageAlt(root);
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes') {
        addMissingImageAlt(mutation.target);
      } else {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) addMissingImageAlt(node);
        });
      }
    });
  });
  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['alt', 'data-icon-name', 'data-alt', 'aria-label', 'aria-labelledby', 'title', 'data-decorative', 'role', 'aria-hidden'],
  });
  return observer;
}

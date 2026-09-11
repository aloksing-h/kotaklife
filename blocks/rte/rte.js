export default function decorate(block) {
  if (block.classList.contains('explore-cta')) {
    const buttoncta = block.querySelector('a');
    if (buttoncta) {
      const buttonContainer = buttoncta.closest('p');
      if (buttonContainer) {
        buttonContainer.classList.add('cta-container');
      }
    }
  }

  if (block.classList.contains('subnav')) {
    const links = block.querySelectorAll('a');
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';

    // Production: match current page path on load
    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && href !== '#') {
        const linkPath = new URL(link.href, window.location.origin)
          .pathname.replace(/\/$/, '') || '/';
        if (linkPath === currentPath) {
          link.classList.add('rte-sub-nav-active');
        }
      }
    });

    // Testing: highlight on click (works with # hrefs)
    links.forEach((link) => {
      link.addEventListener('click', () => {
        links.forEach((l) => l.classList.remove('rte-sub-nav-active'));
        link.classList.add('rte-sub-nav-active');
      });
    });
  }
}


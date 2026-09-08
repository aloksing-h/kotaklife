export default function decorate(block) {
  const links = [...block.querySelectorAll('a')];

  const nav = document.createElement('nav');
  nav.className = 'subnav';
  nav.setAttribute('aria-label', 'Sub navigation');

  const ul = document.createElement('ul');
  ul.className = 'subnav-list';
  ul.setAttribute('role', 'tablist');

  const currentPath = window.location.pathname.replace(/\/$/, '');

  links.forEach((link) => {
    const li = document.createElement('li');
    li.className = 'subnav-item';

    const href = link.getAttribute('href')?.replace(/\/$/, '') || '';
    const isActive = href && currentPath.endsWith(href);

    if (isActive) {
      li.classList.add('active');
    }

    const a = document.createElement('a');
    a.className = 'subnav-link';
    a.href = link.getAttribute('href');
    a.textContent = link.textContent;
    a.setAttribute('role', 'tab');
    a.setAttribute('aria-selected', isActive ? 'true' : 'false');

    li.appendChild(a);
    ul.appendChild(li);
  });

  if (!ul.querySelector('.active')) {
    const firstItem = ul.querySelector('.subnav-item');
    if (firstItem) {
      firstItem.classList.add('active');
      firstItem.querySelector('a').setAttribute('aria-selected', 'true');
    }
  }

  nav.appendChild(ul);
  block.textContent = '';
  block.appendChild(nav);

  ul.addEventListener('click', (e) => {
    const clickedLink = e.target.closest('.subnav-link');
    if (!clickedLink) return;

    ul.querySelectorAll('.subnav-item').forEach((item) => {
      item.classList.remove('active');
      item.querySelector('a').setAttribute('aria-selected', 'false');
    });

    clickedLink.closest('.subnav-item').classList.add('active');
    clickedLink.setAttribute('aria-selected', 'true');
  });
}

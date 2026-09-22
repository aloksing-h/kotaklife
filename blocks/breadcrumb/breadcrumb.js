const getPageTitle = async (url) => {
  const resp = await fetch(url);
  if (resp.ok) {
    const html = document.createElement('div');
    html.innerHTML = await resp.text();
    return html.querySelector('title').innerText;
  }

  return '';
};

const getAllPathsExceptCurrent = async (paths) => {
  const result = [];
  // remove first and last slash characters
  const localePrefix = '/in/en';
  const pathsList = paths.replace(new RegExp(`^${localePrefix}(?=/|$)`), '').replace(/^\/|\/$/g, '').split('/');
  for (let i = 0; i < pathsList.length - 1; i += 1) {
    const pathPart = pathsList[i];
    const prevPath = result[i - 1] ? result[i - 1].path : '';
    const path = `${prevPath}/${pathPart}`;
    const url = `${window.location.origin}${path}`;
    const titleUrl = `${window.location.origin}${localePrefix}${path}`;
    /* eslint-disable-next-line no-await-in-loop */
    const name = await getPageTitle(titleUrl);
    if (name) {
      result.push({ path, name, url });
    }
  }
  return result;
};

const createLink = (path) => {
  const pathLink = document.createElement('a');
  pathLink.href = path.url;
  if (path.icon) {
    const icon = document.createElement('img');
    icon.src = path.icon;
    icon.alt = path.name;
    pathLink.append(icon);
  } else {
    pathLink.innerText = path.name;
  }
  return pathLink;
};

export default async function decorate(block) {
  const breadcrumb = document.createElement('nav', '', {
    'aria-label': 'Breadcrumb',
  });
  block.innerHTML = '';
  const HomeLink = createLink({
    path: '',
    name: 'Home',
    icon: '/icons/home-icon.svg',
    url: window.location.origin,
  });
  const breadcrumbLinks = [HomeLink.outerHTML];

  window.setTimeout(async () => {
    const path = window.location.pathname;
    const paths = await getAllPathsExceptCurrent(path);

    paths.forEach((pathPart) => breadcrumbLinks.push(createLink(pathPart).outerHTML));
    const currentPath = document.createElement('span');
    currentPath.innerText = document.querySelector('title').innerText;
    breadcrumbLinks.push(currentPath.outerHTML);

    breadcrumb.innerHTML = breadcrumbLinks.join(
      '<span class="breadcrumb-separator">/</span>',
    );
    block.append(breadcrumb);
  }, 1000);
}

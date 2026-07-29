import {
  createOptimizedPicture,
  decorateIcons,
} from '../../scripts/aem.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';

const searchParams = new URLSearchParams(window.location.search);

function findNextHeading(el) {
  let preceedingEl = el.parentElement?.previousElementSibling || el.parentElement?.parentElement;
  let h = 'H2';
  while (preceedingEl) {
    const lastHeading = [...preceedingEl.querySelectorAll('h1, h2, h3, h4, h5, h6')].pop();
    if (lastHeading) {
      const level = parseInt(lastHeading.nodeName[1], 10);
      h = level < 6 ? `H${level + 1}` : 'H6';
      preceedingEl = false;
    } else {
      preceedingEl = preceedingEl.previousElementSibling || preceedingEl.parentElement;
    }
  }
  return h;
}

function highlightTextElements(terms, elements) {
  elements.forEach((element) => {
    if (!element || !element.textContent) return;

    const matches = [];
    const { textContent } = element;
    terms.forEach((term) => {
      let start = 0;
      let offset = textContent.toLowerCase().indexOf(term.toLowerCase(), start);
      while (offset >= 0) {
        matches.push({ offset, term: textContent.substring(offset, offset + term.length) });
        start = offset + term.length;
        offset = textContent.toLowerCase().indexOf(term.toLowerCase(), start);
      }
    });

    if (!matches.length) return;

    matches.sort((a, b) => a.offset - b.offset);
    let currentIndex = 0;
    const fragment = matches.reduce((acc, { offset, term }) => {
      if (offset < currentIndex) return acc;
      const textBefore = textContent.substring(currentIndex, offset);
      if (textBefore) {
        acc.appendChild(document.createTextNode(textBefore));
      }
      const markedTerm = document.createElement('mark');
      markedTerm.textContent = term;
      acc.appendChild(markedTerm);
      currentIndex = offset + term.length;
      return acc;
    }, document.createDocumentFragment());

    const textAfter = textContent.substring(currentIndex);
    if (textAfter) {
      fragment.appendChild(document.createTextNode(textAfter));
    }
    element.innerHTML = '';
    element.appendChild(fragment);
  });
}

export async function fetchData(source) {
  try {
    const response = await fetch(source);
    if (!response.ok) return null;
    const json = await response.json();
    return json?.data || null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load search data:', error);
    return null;
  }
}

function renderResult(result, searchTerms, titleTag) {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = result.path || '#';

  if (result.image) {
    const wrapper = document.createElement('div');
    wrapper.className = 'search-result-image';
    const pic = createOptimizedPicture(result.image, '', false, [{ width: '375' }]);
    wrapper.append(pic);
    a.append(wrapper);
  }

  if (result.title || result.header) {
    const title = document.createElement(titleTag || 'h4');
    title.className = 'search-result-title';
    const link = document.createElement('a');
    link.href = result.path || '#';
    link.textContent = result.title || result.header;
    highlightTextElements(searchTerms, [link]);
    title.append(link);
    a.append(title);
  }

  if (result.description) {
    const description = document.createElement('p');
    description.textContent = result.description;
    highlightTextElements(searchTerms, [description]);
    a.append(description);
  }

  li.append(a);
  return li;
}

function clearSearchResults(block) {
  const searchResults = block.querySelector('.search-results');
  if (searchResults) searchResults.innerHTML = '';
}

function clearSearch(block) {
  clearSearchResults(block);
  if (window.history.replaceState) {
    const url = new URL(window.location.href);
    url.search = '';
    searchParams.delete('q');
    window.history.replaceState({}, '', url.toString());
  }
}

async function renderResults(block, config, filteredData, searchTerms) {
  clearSearchResults(block);
  const searchResults = block.querySelector('.search-results');
  if (!searchResults) return;

  const headingTag = searchResults.dataset.h || 'h4';

  if (filteredData && filteredData.length) {
    searchResults.classList.remove('no-results');
    filteredData.forEach((result) => {
      const li = renderResult(result, searchTerms, headingTag);
      searchResults.append(li);
    });
  } else {
    const noResultsMessage = document.createElement('li');
    searchResults.classList.add('no-results');
    noResultsMessage.textContent = (config.placeholders && config.placeholders.searchNoResults) || 'No results found.';
    searchResults.append(noResultsMessage);
  }
}

function compareFound(hit1, hit2) {
  return hit1.minIdx - hit2.minIdx;
}

/**
 * Robust filterData prevents undefined.toLowerCase() TypeError
 */
function filterData(searchTerms, data) {
  if (!Array.isArray(data)) return [];

  const foundInHeader = [];
  const foundInMeta = [];

  data.forEach((result) => {
    if (!result) return;
    let minIdx = -1;

    // SAFE GUARD: Coerce header/title to String before calling toLowerCase()
    const headerOrTitle = String(result.header || result.title || '').toLowerCase();

    searchTerms.forEach((term) => {
      const idx = headerOrTitle.indexOf(term);
      if (idx < 0) return;
      if (minIdx < 0 || idx < minIdx) minIdx = idx;
    });

    if (minIdx >= 0) {
      foundInHeader.push({ minIdx, result });
      return;
    }

    // SAFE GUARD: Verify path, title, and description before concatenation
    const pathSegment = (typeof result.path === 'string') ? result.path.split('/').pop() : '';
    const titleStr = String(result.title || '');
    const descStr = String(result.description || '');
    const metaContents = `${titleStr} ${descStr} ${pathSegment}`.toLowerCase();

    searchTerms.forEach((term) => {
      const idx = metaContents.indexOf(term);
      if (idx < 0) return;
      if (minIdx < 0 || idx < minIdx) minIdx = idx;
    });

    if (minIdx >= 0) {
      foundInMeta.push({ minIdx, result });
    }
  });

  return [
    ...foundInHeader.sort(compareFound),
    ...foundInMeta.sort(compareFound),
  ].map((item) => item.result);
}

async function handleSearch(e, block, config) {
  const searchValue = e.target.value;
  searchParams.set('q', searchValue);
  if (window.history.replaceState) {
    const url = new URL(window.location.href);
    url.search = searchParams.toString();
    window.history.replaceState({}, '', url.toString());
  }

  if (searchValue.length < 3) {
    clearSearch(block);
    return;
  }
  const searchTerms = searchValue.toLowerCase().split(/\s+/).filter(Boolean);

  const data = await fetchData(config.source);
  if (!data) return;

  const filteredData = filterData(searchTerms, data);
  await renderResults(block, config, filteredData, searchTerms);
}

function searchResultsContainer(block) {
  const results = document.createElement('ul');
  results.className = 'search-results';
  results.dataset.h = findNextHeading(block);

  results.setAttribute('role', 'status');
  results.setAttribute('aria-live', 'polite');
  results.setAttribute('aria-atomic', true);

  return results;
}

function searchInput(block, config) {
  const input = document.createElement('input');
  input.setAttribute('type', 'search');
  input.className = 'search-input';

  const searchPlaceholder = (config.placeholders && config.placeholders.searchPlaceholder) || "Tell us what you're looking for...";
  input.placeholder = searchPlaceholder;
  input.setAttribute('aria-label', searchPlaceholder);

  input.addEventListener('input', (e) => {
    handleSearch(e, block, config);
  });

  input.addEventListener('keyup', (e) => {
    if (e.code === 'Escape') {
      clearSearch(block);
    }
  });

  return input;
}

function searchIcon() {
  const icon = document.createElement('span');
  icon.classList.add('icon', 'icon-search');
  return icon;
}

function searchBox(block, config) {
  const box = document.createElement('div');
  box.classList.add('search-box');
  box.append(
    searchIcon(),
    searchInput(block, config),
  );

  return box;
}

export default async function decorate(block) {
  const placeholders = (await fetchPlaceholders()) || {};
  const sourceAnchor = block.querySelector('a[href]');
  const source = sourceAnchor ? sourceAnchor.href : '/query-index.json';

  block.innerHTML = '';
  block.append(
    searchBox(block, { source, placeholders }),
    searchResultsContainer(block),
  );

  if (searchParams.get('q')) {
    const input = block.querySelector('input');
    if (input) {
      input.value = searchParams.get('q');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  decorateIcons(block);
}

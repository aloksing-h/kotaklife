/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * Helper for more concisely generating DOM Elements with attributes and children
 * @param {string} tag HTML tag of the desired element
 * @param  {[Object?, ...Element]} items: First item can optionally be an object of attributes,
 * everything else is a child element
 * @returns {Element} The constructred DOM Element
 */
export function domEl(tag, ...items) {
  const element = document.createElement(tag);

  if (!items || items.length === 0) return element;

  let childItems = items; // Use a new variable for the children array.

  // Check if the first item is an attributes object
  if (
    !(items[0] instanceof Element || items[0] instanceof HTMLElement)
    && typeof items[0] === 'object'
  ) {
    const [attributes, ...rest] = items;
    childItems = rest; // Assign the rest of the items to the new variable.

    Object.entries(attributes).forEach(([key, value]) => {
      if (!key.toLowerCase().startsWith('on')) {
        element.setAttribute(
          key,
          Array.isArray(value) ? value.join(' ') : value,
        );
      } else {
        element.addEventListener(key.substring(2).toLowerCase(), value);
      }
    });
  }

  // Iterate over the new childItems variable
  childItems.forEach((item) => {
    // Use a new variable for the node to be appended.
    let node;
    if (item instanceof Element || item instanceof HTMLElement) {
      node = item;
    } else {
      node = document.createTextNode(item);
    }
    element.appendChild(node);
  });

  return element;
}

/*
  More short hand functions can be added for very common DOM elements below.
  domEl function from above can be used for one off DOM element occurrences.
*/
export function div(...items) {
  return domEl('div', ...items);
}
export function p(...items) {
  return domEl('p', ...items);
}
export function a(...items) {
  return domEl('a', ...items);
}
export function h1(...items) {
  return domEl('h1', ...items);
}
export function h2(...items) {
  return domEl('h2', ...items);
}
export function h3(...items) {
  return domEl('h3', ...items);
}
export function h4(...items) {
  return domEl('h4', ...items);
}
export function h5(...items) {
  return domEl('h5', ...items);
}
export function h6(...items) {
  return domEl('h6', ...items);
}
export function ul(...items) {
  return domEl('ul', ...items);
}
export function ol(...items) {
  return domEl('ol', ...items);
}
export function li(...items) {
  return domEl('li', ...items);
}
export function i(...items) {
  return domEl('i', ...items);
}
export function img(...items) {
  return domEl('img', ...items);
}
export function span(...items) {
  return domEl('span', ...items);
}
export function form(...items) {
  return domEl('form', ...items);
}
export function input(...items) {
  return domEl('input', ...items);
}
export function label(...items) {
  return domEl('label', ...items);
}
export function button(...items) {
  return domEl('button', ...items);
}
export function iframe(...items) {
  return domEl('iframe', ...items);
}
export function nav(...items) {
  return domEl('nav', ...items);
}
export function fieldset(...items) {
  return domEl('fieldset', ...items);
}
export function article(...items) {
  return domEl('article', ...items);
}
export function strong(...items) {
  return domEl('strong', ...items);
}
export function select(...items) {
  return domEl('select', ...items);
}
export function option(...items) {
  return domEl('option', ...items);
}
export function br(...items) {
  return domEl('br', ...items);
}
export function text(...items) {
  return domEl('text', ...items);
}
export function table(...items) { return domEl('table', ...items); }
export function tbody(...items) { return domEl('tbody', ...items); }
export function thead(...items) { return domEl('thead', ...items); }
export function th(...items) { return domEl('th', ...items); }
export function tr(...items) { return domEl('tr', ...items); }
export function td(...items) { return domEl('td', ...items); }

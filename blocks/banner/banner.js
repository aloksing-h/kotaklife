// import dataMapKotakObj from '../../scripts/constant.js';
// import {
//   button, div, img, span,
// } from '../../scripts/dom-helpers.js';

// /**
//  * Updates search input value and dispatches 'input' event to trigger search.js live filtering
//  * @param {HTMLInputElement} searchInput
//  * @param {string} value
//  */
// function updateAndTriggerSearch(searchInput, value) {
//   if (!searchInput) return;
//   searchInput.value = value;
//   searchInput.focus();
//   searchInput.dispatchEvent(new Event('input', { bubbles: true }));
// }

// /**
//  * Initializes Gemini AI search features (Voice mic, Sparkle icon, Submit arrow)
//  * @param {HTMLElement} searchBox
//  * @param {HTMLInputElement} searchInput
//  */
// function initGeminiSearchCapabilities(searchBox, searchInput) {
//   if (!searchBox || !searchInput) return;

//   // 1. Prepend Gemini AI Sparkle Icon
//   if (!searchBox.querySelector('.gemini-sparkle-icon')) {
//     const sparkleIcon = span(
//       { class: 'gemini-sparkle-icon' },
//       img({
//         src: `${window.hlx?.codeBasePath || ''}/icons/gemini_svg.webp`,
//         alt: 'Gemini AI Sparkle',
//         width: '20',
//         height: '20',
//       }),
//     );
//     searchBox.prepend(sparkleIcon);
//   }

//   // 2. Append Voice Mic & Submit Arrow Buttons
//   if (!searchBox.querySelector('.search-actions')) {
//     const micBtn = button(
//       { class: 'search-action-btn mic-btn', type: 'button', 'aria-label': 'Voice search' },
//       img({
//         src: `${window.hlx?.codeBasePath || ''}/icons/mic_dp.svg`,
//         alt: 'Microphone',
//         width: '16',
//         height: '16',
//       }),
//     );

//     const submitBtn = button(
//       { class: 'search-action-btn submit-btn', type: 'button', 'aria-label': 'Ask Gemini' },
//       img({
//         src: `${window.hlx?.codeBasePath || ''}/icons/arrow_right.svg`,
//         alt: 'Submit',
//         width: '16',
//         height: '16',
//       }),
//     );

//     const actionsWrapper = div({ class: 'search-actions' }, micBtn, submitBtn);
//     searchBox.append(actionsWrapper);

//     // 3. Web Speech API Voice Search
//     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (SpeechRecognition) {
//       const recognition = new SpeechRecognition();
//       recognition.continuous = false;
//       recognition.interimResults = false;
//       recognition.lang = 'en-US';

//       recognition.onstart = () => {
//         micBtn.classList.add('listening');
//         searchInput.placeholder = 'Listening... Speak your query now';
//       };

//       recognition.onresult = (event) => {
//         const { transcript } = event.results[0][0];
//         updateAndTriggerSearch(searchInput, transcript);
//       };

//       recognition.onend = () => {
//         micBtn.classList.remove('listening');
//         searchInput.placeholder = "Tell us what you're looking for...";
//       };

//       micBtn.addEventListener('click', () => {
//         try {
//           recognition.start();
//         } catch (err) {
//           recognition.stop();
//         }
//       });
//     } else {
//       micBtn.style.display = 'none';
//     }

//     // 4. Submit Arrow Click Handler
//     submitBtn.addEventListener('click', () => {
//       const query = searchInput.value.trim();
//       if (query) {
//         searchInput.dispatchEvent(new Event('input', { bubbles: true }));
//       }
//     });
//   }
// }

// /**
//  * Decorates and initializes the Banner block
//  * @param {HTMLElement} block The banner block element
//  */
// export default async function decorate(block) {
//   // 1. System Class Indexing via dataMapKotakObj
//   if (dataMapKotakObj?.addIndexed) {
//     dataMapKotakObj.CLASS_PREFIXES = [
//       'banner-cont',
//       'banner-sec',
//       'banner-sub',
//       'banner-inner-text',
//       'banner-list',
//       'banner-list-content',
//     ];
//     dataMapKotakObj.addIndexed(block);
//   }

//   // 2. Goal Cards (.banner-sub3 > li) Click & Keyboard Actions
//   const goalCards = block.querySelectorAll('.banner-sub3 > li');
//   goalCards.forEach((card) => {
//     card.setAttribute('role', 'button');
//     card.setAttribute('tabindex', '0');

//     const handleSelect = () => {
//       const cardTitle = card.childNodes[0]?.textContent?.trim() || '';
//       const searchInput = document.querySelector('.search-container input.search-input');
//       if (searchInput && cardTitle) {
//         updateAndTriggerSearch(searchInput, cardTitle);
//       }
//     };

//     card.addEventListener('click', handleSelect);
//     card.addEventListener('keydown', (e) => {
//       if (e.key === 'Enter' || e.key === ' ') {
//         e.preventDefault();
//         handleSelect();
//       }
//     });
//   });

//   // 3. Prompt Question Chips (.banner-sub4 > li) Click & Keyboard Actions
//   const promptChips = block.querySelectorAll('.banner-sub4 > li');
//   promptChips.forEach((chip) => {
//     chip.setAttribute('role', 'button');
//     chip.setAttribute('tabindex', '0');

//     const handleChipClick = () => {
//       const chipText = chip.textContent.trim();
//       const searchInput = document.querySelector('.search-container input.search-input');
//       if (searchInput && chipText) {
//         updateAndTriggerSearch(searchInput, chipText);
//       }
//     };

//     chip.addEventListener('click', handleChipClick);
//     chip.addEventListener('keydown', (e) => {
//       if (e.key === 'Enter' || e.key === ' ') {
//         e.preventDefault();
//         handleChipClick();
//       }
//     });
//   });

//   // 4. Enhance Integrated Search Bar
//   const section = block.closest('.section');
//   if (section) {
//     const searchBox = section.querySelector('.search-box');
//     const searchInput = section.querySelector('input.search-input');
//     if (searchBox && searchInput) {
//       searchInput.setAttribute('placeholder', "Tell us what you're looking for...");
//       initGeminiSearchCapabilities(searchBox, searchInput);
//     }
//   }
// }

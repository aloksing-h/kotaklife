// import { decorateBlock, loadBlock, decorateIcons } from '../../scripts/aem.js';

// function showYear(block, index) {
//   const markers = block.querySelectorAll('.timeline-marker-btn');
//   const panels = block.querySelectorAll('.timeline-panel');
//   const total = markers.length;
//   const activeIndex = ((index % total) + total) % total;

//   markers.forEach((marker, i) => {
//     marker.setAttribute('aria-selected', i === activeIndex);
//   });
//   panels.forEach((panel, i) => {
//     panel.setAttribute('aria-hidden', i !== activeIndex);
//   });
//   block.dataset.activeYear = activeIndex;
//   markers[activeIndex].scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
// }

// export default async function decorate(block) {
//   const rows = [...block.children];
//   const nestedBlockLoads = [];

//   const nav = document.createElement('div');
//   nav.className = 'timeline-nav';

//   const line = document.createElement('div');
//   line.className = 'timeline-line';

//   const markerList = document.createElement('ol');
//   markerList.className = 'timeline-markers';
//   markerList.setAttribute('role', 'tablist');

//   const arrows = document.createElement('div');
//   arrows.className = 'timeline-arrows';
//   const prevButton = document.createElement('button');
//   prevButton.type = 'button';
//   prevButton.className = 'timeline-arrow timeline-arrow-prev';
//   prevButton.setAttribute('aria-label', 'Previous year');
//   prevButton.innerHTML = '<span class="icon icon-arrow_right"></span>';
//   const nextButton = document.createElement('button');
//   nextButton.type = 'button';
//   nextButton.className = 'timeline-arrow timeline-arrow-next';
//   nextButton.setAttribute('aria-label', 'Next year');
//   nextButton.innerHTML = '<span class="icon icon-arrow_right"></span>';
//   arrows.append(prevButton, nextButton);

//   const panelsWrapper = document.createElement('div');
//   panelsWrapper.className = 'timeline-panels';

//   rows.forEach((row, index) => {
//     const yearBlock = row.querySelector('.timeline-year');
//     const yearText = yearBlock?.children[0]?.textContent.trim() || '';

//     const cardsBlock = yearBlock?.querySelector('.cards');
//     if (cardsBlock) {
//       decorateBlock(cardsBlock);
//       nestedBlockLoads.push(loadBlock(cardsBlock));
//     }

//     const markerItem = document.createElement('li');
//     markerItem.className = 'timeline-marker';
//     const markerButton = document.createElement('button');
//     markerButton.type = 'button';
//     markerButton.className = 'timeline-marker-btn';
//     markerButton.id = `timeline-year-${index}`;
//     markerButton.setAttribute('role', 'tab');
//     markerButton.setAttribute('aria-controls', `timeline-panel-${index}`);
//     markerButton.textContent = yearText;
//     markerButton.addEventListener('click', () => showYear(block, index));
//     markerItem.append(markerButton);
//     markerList.append(markerItem);

//     const panel = document.createElement('div');
//     panel.className = 'timeline-panel';
//     panel.id = `timeline-panel-${index}`;
//     panel.setAttribute('role', 'tabpanel');
//     panel.setAttribute('aria-labelledby', markerButton.id);
//     if (yearBlock) panel.append(yearBlock);
//     panelsWrapper.append(panel);

//     row.remove();
//   });

//   nav.append(line, markerList, arrows);
//   block.append(nav, panelsWrapper);

//   prevButton.addEventListener('click', () => {
//     showYear(block, parseInt(block.dataset.activeYear, 10) - 1);
//   });
//   nextButton.addEventListener('click', () => {
//     showYear(block, parseInt(block.dataset.activeYear, 10) + 1);
//   });

//   decorateIcons(block);
//   await Promise.all(nestedBlockLoads);
//   showYear(block, Math.floor((rows.length - 1) / 2));
// }

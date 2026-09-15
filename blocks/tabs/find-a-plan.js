// function decorateCustomCardsTags(panel) {
//   const customCards = panel.querySelector('.custom-cards');
//   if (!customCards) return;

//   customCards.querySelectorAll('*').forEach((element) => {
//     const tagClass = `find-a-plan-tag-${element.tagName.toLowerCase()}`;
//     element.classList.add(tagClass);
//   });
// }

// function decorateCardParagraphs(panel) {
//   panel.querySelectorAll('.custom-cards-card-body').forEach((cardBody) => {
//     const paragraphs = [...cardBody.children].filter((child) => child.tagName === 'P');

//     paragraphs.forEach((paragraph, index) => {
//       paragraph.classList.add('find-a-plan-card-text');
//       paragraph.classList.add(`find-a-plan-card-text--${index + 1}`);
//     });
//   });
// }

// export default function decorateFindAPlan(block) {
//   block.querySelectorAll('.tabs-panel').forEach((panel) => {
//     decorateCustomCardsTags(panel);
//     decorateCardParagraphs(panel);
//   });
// }

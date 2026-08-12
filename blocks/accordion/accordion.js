/*
 * Accordion Block
 * Recreate an accordion
 * https://www.hlx.live/developer/block-collection/accordion
 */

export default function decorate(block) {
  let index = 1;
  [...block.children].forEach((row) => {
    const label = row.children[0];
    const body = row.children[1];
    if (!label) return;

    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';

    const number = document.createElement('span');
    number.className = 'accordion-item-number';
    number.textContent = index;
    summary.append(number);
    summary.append(...label.childNodes);
    label.remove();

    if (body) {
      body.className = 'accordion-item-body';
    }

    const details = document.createElement('details');
    details.className = 'accordion-item';
    if (body) {
      details.append(summary, body);
    } else {
      details.append(summary);
    }
    row.append(details);
    index += 1;
  });
}

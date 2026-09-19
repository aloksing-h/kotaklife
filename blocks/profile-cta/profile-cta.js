/**
 * Profile-CTA block decorator
 * @param {Element} block The profile-cta block element
 */
export default function decorate(block) {
  // Strict guard: ONLY run for .leadership variant so no other profile-cta on the site is affected
  if (!block.closest('.leadership')) {
    return;
  }

  const bioP = block.querySelector(':scope > div:nth-child(2) p:nth-of-type(3)');
  if (!bioP || bioP.querySelector('.bio-read-more')) return;

  const fullText = bioP.textContent.trim();
  // Cut-off threshold: ~115 characters to match Figma mobile 3-line layout ending at "quis nostrud"
  const cutIndex = 115;
  if (fullText.length <= cutIndex) return;

  // Find nearest space before or after cutIndex to split cleanly without breaking words
  let splitPos = fullText.indexOf('quis nostrud');
  if (splitPos !== -1) {
    splitPos += 'quis nostrud'.length;
  } else {
    const lastSpace = fullText.lastIndexOf(' ', cutIndex);
    splitPos = lastSpace > 0 ? lastSpace : cutIndex;
  }

  const shortText = fullText.substring(0, splitPos);
  const remainingText = fullText.substring(splitPos);

  const shortSpan = document.createElement('span');
  shortSpan.className = 'bio-short';
  shortSpan.textContent = shortText;

  const moreSpan = document.createElement('span');
  moreSpan.className = 'bio-more is-hidden';
  moreSpan.textContent = remainingText;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'bio-read-more';
  btn.setAttribute('aria-expanded', 'false');
  btn.textContent = ' Read more..';

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const isHidden = moreSpan.classList.contains('is-hidden');
    moreSpan.classList.toggle('is-hidden');
    block.classList.toggle('is-expanded');
    btn.setAttribute('aria-expanded', String(isHidden));
    btn.textContent = isHidden ? ' Read less..' : ' Read more..';
  });

  bioP.replaceChildren(shortSpan, moreSpan, btn);
}

/**
 * Splits a richtext paragraph on <br> into `.hero-line` spans so each authored
 * line (eyebrow / title / description) can be styled independently.
 * @param {Element} p The paragraph to split
 * @returns {Element[]} The line spans (empty lines are dropped)
 */
function splitLines(p) {
  const segments = [[]];
  [...p.childNodes].forEach((node) => {
    if (node.nodeName === 'BR') {
      segments.push([]);
      return;
    }
    segments[segments.length - 1].push(node);
  });

  const lines = segments
    .filter((segment) => segment.some((node) => node.textContent.trim()))
    .map((segment) => {
      const line = document.createElement('span');
      line.className = 'hero-line';
      line.append(...segment);
      return line;
    });

  p.replaceChildren(...lines);
  return lines;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  // all fields are prefixed col1_ so the backend renders a single cell
  const cell = block.querySelector(':scope > div > div') || block.firstElementChild;
  if (!cell) return;
  const children = [...cell.children];

  // 1st picture = desktop background, 2nd = mobile background
  const pictures = children
    .map((el) => el.querySelector('picture'))
    .filter(Boolean)
    .slice(0, 2);

  const buttonWrapper = children.find((el) => el.querySelector('a') && !el.querySelector('picture'));
  const buttonIndex = children.indexOf(buttonWrapper);
  const paragraphs = children.filter((el) => el !== buttonWrapper && !el.querySelector('picture'));
  const textBefore = paragraphs.filter((p) => buttonIndex === -1 || children.indexOf(p) < buttonIndex);
  const terms = paragraphs.filter((p) => buttonIndex !== -1 && children.indexOf(p) > buttonIndex);

  // the alt field renders as a plain paragraph right after the images; only treat it
  // as alt text when there is still richtext content following it
  let alt = '';
  if (textBefore.length > 1 && textBefore[0].children.length === 0) {
    alt = textBefore.shift().textContent.trim();
  }

  // eyebrow = lines before the first <strong>, title = the <strong> line, rest = description
  const lines = textBefore.flatMap((p) => {
    p.classList.add('hero-text');
    return splitLines(p);
  });
  let titleIndex = lines.findIndex((line) => line.querySelector('strong'));
  if (titleIndex === -1 && lines.length) titleIndex = 0;
  lines.forEach((line, i) => {
    if (i < titleIndex) line.classList.add('hero-eyebrow');
    else if (i === titleIndex) line.classList.add('hero-title');
    else line.classList.add('hero-description');
  });

  block.replaceChildren();

  pictures.forEach((picture, i) => {
    picture.classList.add('hero-image');
    if (pictures.length > 1) picture.classList.add(i === 0 ? 'hero-image-desktop' : 'hero-image-mobile');
    const img = picture.querySelector('img');
    if (img) {
      // hero is the LCP candidate
      img.loading = 'eager';
      if (alt) img.alt = alt;
    }
    block.append(picture);
  });

  const content = document.createElement('div');
  content.className = 'hero-content';
  content.append(...textBefore);
  if (buttonWrapper) {
    buttonWrapper.className = 'button-wrapper';
    const link = buttonWrapper.querySelector('a');
    link.className = 'button';
    link.title = link.title || link.textContent.trim();
    content.append(buttonWrapper);
  }
  if (content.childElementCount) block.append(content);

  terms.forEach((p) => {
    p.classList.add('hero-terms');
    block.append(p);
  });
}

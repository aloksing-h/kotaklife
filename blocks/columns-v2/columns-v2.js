export default function decorate(block) {
  // Count the columns and add a helper class for styling
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);
}
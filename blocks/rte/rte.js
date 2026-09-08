export default function decorate(block) {
  if (block.classList.contains('explore-cta')) {
    const buttoncta = block.querySelector('a');
    if (buttoncta) {
      const buttonContainer = buttoncta.closest('p');
      if (buttonContainer) {
        buttonContainer.classList.add('cta-container');
      }
    }
  }
}

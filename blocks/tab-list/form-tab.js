/**
 * Apply Find a Plan variant classes without moving authored content.
 * @param {Element} block The tab-list block
 */
export default function decorateFormTab(block) {
  // Select original tab buttons and panels
  const originalTabButtons = block.querySelectorAll('button[role="tab"]');
  const tabPanels = block.querySelectorAll('div[role="tabpanel"]');

  // STRIP EXISTING HOVER LISTENERS: 
  // Clone the buttons and replace them in the DOM to wipe inherited AEM boilerplate events
  const tabButtons = Array.from(originalTabButtons).map(button => {
    const cleanButton = button.cloneNode(true);
    button.parentNode.replaceChild(cleanButton, button);
    return cleanButton;
  });

  // Ensure the first tab is open by default if none are initially selected
  const hasActiveTab = tabButtons.some(btn => btn.getAttribute('aria-selected') === 'true');
  if (!hasActiveTab && tabButtons.length > 0) {
    tabButtons[0].setAttribute('aria-selected', 'true');
    if (tabPanels.length > 0) {
      tabPanels[0].removeAttribute('hidden');
      tabPanels[0].setAttribute('aria-hidden', 'false');
      tabPanels[0].classList.remove('hidden');
    }
  }

  // Apply ONLY the click listener to our fresh, clean buttons
  tabButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent any default button behaviors
      
      // Check if the clicked button is already open
      const isAlreadyActive = button.getAttribute('aria-selected') === 'true';
      
      // 1. Deactivate all tabs and hide all panels
      tabButtons.forEach(btn => btn.setAttribute('aria-selected', 'false'));
      tabPanels.forEach(panel => {
        panel.setAttribute('hidden', '');
        panel.setAttribute('aria-hidden', 'true');
        panel.classList.add('hidden');
      });

      // 2. If it was NOT active before clicking, open it. 
      // If it WAS active, it remains closed (toggled off).
      if (!isAlreadyActive) {
        button.setAttribute('aria-selected', 'true');
        
        const targetPanelId = button.getAttribute('aria-controls');
        const targetPanel = block.querySelector(`#${targetPanelId}`);
        
        if (targetPanel) {
          targetPanel.removeAttribute('hidden');
          targetPanel.setAttribute('aria-hidden', 'false');
          targetPanel.classList.remove('hidden');
        }
      }
    });
  });
}
// Track current step
let currentStep = 1;

// 1. Initialize history state on page load
window.addEventListener('DOMContentLoaded', () => {
  history.replaceState({ step: 1 }, '', '#step1');
});

// 2. Switch steps and add a history state entry
function goToStep(targetStep) {
  currentStep = targetStep;
  renderStep(targetStep);
  
  // Push step into browser history URL hash
  history.pushState({ step: targetStep }, '', `#step${targetStep}`);
}

// 3. Helper to update DOM visibility
function renderStep(stepNumber) {
  // Hide all steps
  document.querySelectorAll('.reg__step').forEach((el) => {
    el.style.display = 'none';
    el.classList.remove('active');
  });

  // Show selected step
  const targetEl = document.getElementById(`step-${stepNumber}`);
  if (targetEl) {
    targetEl.style.display = 'block';
    targetEl.classList.add('active');
  }
}

// 4. Handle Browser 'Back' / 'Forward' buttons
window.addEventListener('popstate', (event) => {
  if (event.state && event.state.step) {
    currentStep = event.state.step;
    renderStep(currentStep);
  }
});

// 5. Submit Form (from Step 2 -> Step 3)
function submitForm() {
  // Place your async fetch submission logic here later
  
  // Navigate to Step 3 (Confirmation)
  goToStep(3);
}
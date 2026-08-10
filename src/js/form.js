let currentStep = 1;

// 1. Page Load & Reload Handler
window.addEventListener("DOMContentLoaded", () => {
	if ("scrollRestoration" in history) {
		history.scrollRestoration = "manual";
	}

	// Detect step from URL hash (e.g., "#step2" -> 2)
	const hash = window.location.hash;
	const stepFromHash = hash ? parseInt(hash.replace("#step", ""), 10) : 1;

	// Restore step if valid (1, 2, or 3), otherwise default to Step 1
	if (stepFromHash >= 1 && stepFromHash <= 3) {
		currentStep = stepFromHash;
	} else {
		currentStep = 1;
	}

	renderStep(currentStep);
	history.replaceState({ step: currentStep }, "", `#step${currentStep}`);
});

// 2. Warn user when reloading or closing the tab
window.addEventListener("beforeunload", (event) => {
	if (currentStep === 1 || currentStep === 2) {
		event.preventDefault();
		event.returnValue = ""; // Standard browser trigger for the exit modal
	}
});

// 3. Switch steps and add a history state entry
function goToStep(targetStep) {
	currentStep = targetStep;
	renderStep(targetStep);

	history.pushState({ step: targetStep }, "", `#step${targetStep}`);
}

// 4. Update DOM visibility & smooth scroll
function renderStep(stepNumber) {
	// Hide all steps
	document.querySelectorAll(".reg__step").forEach((el) => {
		el.style.display = "none";
		el.classList.remove("active");
	});

	// Show selected step
	const targetEl = document.getElementById(`step-${stepNumber}`);
	if (targetEl) {
		targetEl.style.display = "block";
		targetEl.classList.add("active");
	}

	// Smooth scroll to top of page
	window.scrollTo({
		top: 0,
		behavior: "smooth",
	});
}

// 5. Handle Browser 'Back' / 'Forward' buttons
window.addEventListener("popstate", (event) => {
	if (event.state && event.state.step) {
		currentStep = event.state.step;
		renderStep(currentStep);
	}
});

function submitForm() {
	goToStep(3);
}
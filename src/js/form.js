let currentStep = 1;

function isSecurityVerified() {
	const honeypot = document.querySelector('input[name="website"]');
	if (honeypot && honeypot.value.trim() !== '') {
		console.warn('Bot detekován pomocí honeypotu.');
		return false;
	}

	if (typeof turnstile !== 'undefined') {
		const token = turnstile.getResponse();
		if (!token) {
			alert('Probíhá bezpečnostní ověření. Počkejte chvíli a zkuste to znovu.');
			return false;
		}
	}

	return true;
}

function onTurnstileError() {
	console.warn('Došlo k chybě Turnstile. Automatické resetování....');
	
	if (typeof turnstile !== 'undefined') {
		turnstile.reset();
	}
}

function onTurnstileExpired() {
	if (typeof turnstile !== 'undefined') {
		turnstile.reset();
	}
}

window.addEventListener("DOMContentLoaded", () => {
	if ("scrollRestoration" in history) {
		history.scrollRestoration = "manual";
	}

	const hash = window.location.hash;
	const stepFromHash = hash ? parseInt(hash.replace("#step", ""), 10) : 1;

	if (stepFromHash >= 1 && stepFromHash <= 3) {
		currentStep = stepFromHash;
	} else {
		currentStep = 1;
	}

	renderStep(currentStep);
	history.replaceState({ step: currentStep }, "", `#step${currentStep}`);
});

window.addEventListener("beforeunload", (event) => {
	if (currentStep === 1 || currentStep === 2) {
		event.preventDefault();
		event.returnValue = "";
	}
});

function goToStep(targetStep) {
	if (currentStep === 1 && targetStep === 2) {
		if (!isSecurityVerified()) {
			return;
		}
	}

	currentStep = targetStep;
	renderStep(targetStep);

	history.pushState({ step: targetStep }, "", `#step${targetStep}`);
}

function renderStep(stepNumber) {
	document.querySelectorAll(".reg__step").forEach((el) => {
		el.style.display = "none";
		el.classList.remove("active");
	});

	const targetEl = document.getElementById(`step-${stepNumber}`);
	if (targetEl) {
		targetEl.style.display = "block";
		targetEl.classList.add("active");
	}

	window.scrollTo({
		top: 0,
		behavior: "smooth",
	});
}

window.addEventListener("popstate", (event) => {
	if (event.state && event.state.step) {
		currentStep = event.state.step;
		renderStep(currentStep);
	}
});

function submitForm() {
	goToStep(3);
}
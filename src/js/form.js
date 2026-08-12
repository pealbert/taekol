let currentStep = 1;

// 1. Attach Turnstile callbacks to window
window.onTurnstileError = function () {
	console.warn("Došlo k chybě Turnstile. Automatické resetování....");
	if (typeof turnstile !== "undefined") turnstile.reset();
};

window.onTurnstileExpired = function () {
	if (typeof turnstile !== "undefined") turnstile.reset();
};

function isSecurityVerified() {
	const honeypot = document.querySelector('input[name="website"]');
	if (honeypot && honeypot.value.trim() !== "") {
		console.warn("Bot detekován pomocí honeypotu.");
		return false;
	}

	if (typeof turnstile !== "undefined") {
		const token = turnstile.getResponse();
		if (!token) {
			alert("Probíhá bezpečnostní ověření. Počkejte chvíli a zkuste to znovu.");
			return false;
		}
	}

	return true;
}

window.addEventListener("DOMContentLoaded", () => {
	if ("scrollRestoration" in history) {
		history.scrollRestoration = "manual";
	}

	const hash = window.location.hash;
	const stepFromHash = hash ? parseInt(hash.replace("#step", ""), 10) : 1;
	currentStep = stepFromHash >= 1 && stepFromHash <= 3 ? stepFromHash : 1;

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
	if (targetStep === 2) {
		const step1Inputs = document.querySelectorAll("#step-1 input");
		for (const input of step1Inputs) {
			if (!input.checkValidity()) {
				input.reportValidity();
				return;
			}
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

	window.scrollTo({ top: 0, behavior: "smooth" });
}

window.addEventListener("popstate", (event) => {
	if (event.state && event.state.step) {
		currentStep = event.state.step;
		renderStep(currentStep);
	}
});

// 2. Updated submitForm with API call and security check
async function submitForm() {
	if (!isSecurityVerified()) return;

	const honeypot = document.querySelector('input[name="website"]')?.value || "";
	const token = typeof turnstile !== "undefined" ? turnstile.getResponse() : "";
	const firstName = document.getElementById("first_name")?.value;
	const lastName = document.getElementById("last_name")?.value;

	try {
		//  const response = await fetch('/api/submit', {
		//    method: 'POST',
		//    headers: { 'Content-Type': 'application/json' },
		//    body: JSON.stringify({
		//      token,
		//      honeypot,
		//      first_name: firstName,
		//      last_name: lastName,
		//    }),
		//  });

		//  const result = await response.json();

		//  if (!response.ok || !result.success) {
		//    alert(result.error || 'Ověření selhalo. Zkuste to prosím znovu.');
		//    if (typeof turnstile !== 'undefined') turnstile.reset();
		//    return;
		//  }

		// Success -> proceed to Step 3
		goToStep(3);
	} catch (err) {
		alert("Chyba při odesílání serveru.");
	}
}

window.goToStep = goToStep;
window.submitForm = submitForm;

let currentStep = 1;
let isFormDirty = false;

const today = new Date().toISOString().split('T')[0];
document.getElementById('birth_date').setAttribute('max', today);


// const memberships = {
// 	{
		
// 	},
// 	{

// 	},
// 	{

// 	},
// 	{

// 	},
// 	{

// 	},
// };

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

	const form = document.getElementById("reg");
	const markFormDirty = (event) => {
		if (event.target.name !== "website") {
			isFormDirty = true;
		}
	};

	form?.addEventListener("input", markFormDirty);
	form?.addEventListener("change", markFormDirty);

	const hash = window.location.hash;
	const stepFromHash = hash ? parseInt(hash.replace("#step", ""), 10) : 1;
	currentStep = stepFromHash >= 1 && stepFromHash <= 3 ? stepFromHash : 1;

	renderStep(currentStep);
	history.replaceState({ step: currentStep }, "", `#step${currentStep}`);
});

window.addEventListener("beforeunload", (event) => {
	if (!isFormDirty || currentStep === 3) return;

	event.preventDefault();
	event.returnValue = "";
});

function validateStep1() {
	const fields = document.querySelectorAll("#step-1 input, #step-1 select");

	for (const field of fields) {
		if (field.disabled) continue;

		if (!field.checkValidity()) {
			field.reportValidity();
			field.focus();
			return false;
		}
	}

	return true;
}

function goToStep(targetStep) {
	if (targetStep === 2 && !validateStep1()) {
		return;
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

		isFormDirty = false;
		goToStep(3);
	} catch (err) {
		alert("Chyba při odesílání serveru.");
	}
}

window.goToStep = goToStep;
window.submitForm = submitForm;

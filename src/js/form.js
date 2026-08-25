import QRCode from 'qrcode';

let currentStep = 1;
let isFormDirty = false;

const plans = [
	{
		id: 1,
		name: "start",
		validity: "3 měsíců",
		price: "2000 Kč"
	},
	{
		id: 2,
		name: "pololetni",
		validity: "5 měsíců",
		price: "3750 Kč"
	},
	{
		id: 3,
		name: "rocni",
		validity: "10 měsíců",
		price: "6500 Kč"
	},
]

function getSelectedPlan() {
	const selectedName = document.getElementById("membership_validity").value;
	return plans.find((plan) => plan.name === selectedName);
}

function initializeBirthDate() {
	const birthDate = document.getElementById("birth_date");
	const today = new Date().toISOString().split("T")[0];

	birthDate?.setAttribute("max", today);
}

function generateSpaydString() {
	const selectedPlan = getSelectedPlan();
	const lastName = document.getElementById("last_name")?.value.trim();

	if (!selectedPlan || !lastName) return null;

	const amount = Number.parseFloat(selectedPlan.price).toFixed(2);
	const message = `${lastName}, ${selectedPlan.validity}`;

	return [
		"SPD*1.0",
		"ACC:CZ8008000000001804576309",
		"RN:Akademie Taekwon-do SKUP Olomouc",
		`AM:${amount}`,
		"CC:CZK",
		"X-VS:18",
		`MSG:${message}`,
	].join("*");
}

async function initializeQRCode() {
	const canvas = document.getElementById("qr-canvas");
	const spaydString = generateSpaydString();

	if (!canvas || !spaydString) return;

	try {
		await QRCode.toCanvas(canvas, spaydString, {
			width: 200,
			margin: 2,
			errorCorrectionLevel: "M",
			color: {
				dark: "#F9F9F9",
				light: "#00000000",
			},
		});
	} catch (error) {
		console.error("QR generation failed:", error);
	}
}

function initializeCopyButtons() {
	const copyButtons = document.querySelectorAll("#step-2 .copy-button");

	copyButtons.forEach((button) => {
		button.addEventListener("click", async () => {
			const detailsValue = button.closest(".details__value");
			let value = detailsValue
				?.querySelector("span")
				?.textContent.trim();

			if (!value) return;

			const label = detailsValue.previousElementSibling?.textContent.trim();

			if (label === "Částka") {
				value = value.replace(/[^\d,.-]/g, "");
			}

			const originalIcon = button.innerHTML;
			const originalLabel = button.getAttribute("aria-label");

			try {
				await navigator.clipboard.writeText(value);

				button.innerHTML = `
					<svg viewBox="0 0 17 13" fill="none" xmlns="http://www.w3.org/2000/svg">
						<title>Zkopírováno</title>
						<path d="M16.8239 0.185131C16.8817 0.243497 16.9273 0.312664 16.9583 0.388681C16.9893 0.464698 17.005 0.546076 17.0046 0.628166C17.0041 0.710257 16.9875 0.791452 16.9556 0.867113C16.9238 0.942775 16.8773 1.01142 16.8189 1.06913L5.69395 12.0691C5.57758 12.1841 5.42076 12.2489 5.25716 12.2495C5.09357 12.2502 4.93624 12.1867 4.81895 12.0726L0.193947 7.57263C0.134116 7.51564 0.086178 7.44736 0.0529071 7.37173C0.0196361 7.29609 0.00169236 7.21461 0.00011404 7.132C-0.00146428 7.04939 0.0133542 6.96728 0.043712 6.89043C0.0740698 6.81359 0.119364 6.74352 0.176976 6.68429C0.234587 6.62506 0.303371 6.57784 0.379348 6.54536C0.455326 6.51289 0.536989 6.4958 0.619614 6.49509C0.702238 6.49437 0.784184 6.51005 0.86071 6.54121C0.937236 6.57237 1.00682 6.6184 1.06545 6.67663L5.25095 10.7496L15.9399 0.180631C15.9983 0.122904 16.0675 0.0772402 16.1435 0.0462489C16.2195 0.0152576 16.3009 -0.000454314 16.383 9.99814e-06C16.4651 0.00047431 16.5463 0.0171058 16.6219 0.0489549C16.6976 0.0808041 16.7662 0.126747 16.8239 0.185131Z" fill="currentColor"/>
					</svg>
				`;

				button.setAttribute("aria-label", "Zkopírováno");

				setTimeout(() => {
					button.innerHTML = originalIcon;
					button.setAttribute("aria-label", originalLabel);
				}, 1500);
			} catch (error) {
				console.error("Copying failed:", error);
			}
		});
	});
}

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

function updatePaymentPreview() {
	const selectedPlan = getSelectedPlan();
	const lastName = document.getElementById("last_name")?.value.trim();

	if (!selectedPlan) return;

	const previewValues = document.querySelectorAll(
		"#step-2 .preview__row span:last-child"
	);

	previewValues[0].textContent = selectedPlan.validity;
	previewValues[1].textContent = selectedPlan.price;

	const detailValues = document.querySelectorAll(
		"#step-2 .details .details__value span"
	);

	detailValues[3].textContent = selectedPlan.price;
	detailValues[4].textContent = `${lastName}, ${selectedPlan.validity}`;
}

function updateConfirmationEmail() {
	const email = document.getElementById("email")?.value;
	const output = document.querySelector(
		"#step-3 fieldset:first-of-type p b"
	);

	if (output) output.textContent = email;
}

function goToStep(targetStep) {
	if (targetStep === 2 && !validateStep1()) {
		return;
	}

	if (targetStep === 2) {
		updatePaymentPreview();
		initializeQRCode();
	}

	currentStep = targetStep;
	renderStep(targetStep);
	history.pushState({ step: targetStep }, "", `#step${targetStep}`);
}

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
		updateConfirmationEmail();
		goToStep(3);
	} catch (err) {
		alert("Chyba při odesílání serveru.");
	}
}

function handlePopState(event) {
	if (event.state && event.state.step) {
		currentStep = event.state.step;
		renderStep(currentStep);
	}
}

function handleBeforeUnload(event) {
	if (!isFormDirty || currentStep === 3) return;

	event.preventDefault();
	event.returnValue = "";
}

function handleTurnstileError() {
	console.warn("Došlo k chybě Turnstile. Automatické resetování....");
	if (typeof turnstile !== "undefined") turnstile.reset();
}

function handleTurnstileExpired() {
	if (typeof turnstile !== "undefined") turnstile.reset();
}

function initializeForm() {
	initializeBirthDate();
	initializeCopyButtons();


	const form = document.getElementById("reg");

	form?.addEventListener("input", (event) => {
		if (event.target.name !== "website") {
			isFormDirty = true;
		}
	});

	form?.addEventListener("change", (event) => {
		if (event.target.name !== "website") {
			isFormDirty = true;
		}
	});

	currentStep = 1;
	renderStep(currentStep);
	history.replaceState(
		{ step: currentStep },
		"",
		`#step${currentStep}`,
	);
}

window.addEventListener("DOMContentLoaded", initializeForm);
window.addEventListener("popstate", handlePopState);
window.addEventListener("beforeunload", handleBeforeUnload);

window.goToStep = goToStep;
window.submitForm = submitForm;
window.onTurnstileError = handleTurnstileError;
window.onTurnstileExpired = handleTurnstileExpired;
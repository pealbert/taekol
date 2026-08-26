import QRCode from "qrcode";

let currentStep = 1;
let isFormDirty = false;
let isSubmitting = false;

const plans = [
	{
		id: 1,
		name: "start",
		validity: "3 měsíců",
		price: "2000 Kč",
	},
	{
		id: 2,
		name: "pololetni",
		validity: "5 měsíců",
		price: "3750 Kč",
	},
	{
		id: 3,
		name: "rocni",
		validity: "10 měsíců",
		price: "6500 Kč",
	},
];

const MAX_PAYMENT_PROOF_SIZE = 5 * 1024 * 1024;
const PAYMENT_PROOF_TYPES = {
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	png: "image/png",
	pdf: "application/pdf",
};
const ATTACHED_PAYMENT_PROOF_ICON = `
	<svg viewBox="0 0 38 40" fill="none" xmlns="http://www.w3.org/2000/svg">
		<title>Potvrzení přiloženo</title>
		<path d="M19.3663 0.240238C19.1315 0.0835951 18.8556 0 18.5733 0C18.2911 0 18.0152 0.0835951 17.7804 0.240238C13.6157 3.01766 8.12226 5.75366 1.28727 6.43658C0.934605 6.47167 0.607565 6.63658 0.369676 6.89929C0.131787 7.162 3.09874e-05 7.50375 0 7.85816V20.0023C0 25.5457 3.0346 30.2461 6.7164 33.6408C10.3911 37.0297 14.9129 39.3142 18.3104 39.9514L18.5733 40L18.8362 39.9514C22.2337 39.3142 26.7556 37.0297 30.4302 33.6408C34.112 30.2461 37.1466 25.5457 37.1466 20.0023V7.85816C37.1466 7.50397 37.0151 7.16241 36.7775 6.89973C36.5399 6.63706 36.2132 6.472 35.8608 6.43658C29.0244 5.75366 23.531 3.01766 19.3663 0.240238ZM2.85743 20.0023V9.12686C9.28094 8.24677 14.5243 5.72651 18.5733 3.13482C22.6223 5.72651 27.8657 8.24677 34.2892 9.12686V20.0023C34.2892 24.4598 31.839 28.4545 28.4929 31.5406C25.2426 34.538 21.3393 36.4982 18.5733 37.0897C15.8073 36.4968 11.9041 34.538 8.65374 31.5406C5.30768 28.4545 2.85743 24.4598 2.85743 20.0023ZM28.1557 15.2975C28.416 15.028 28.56 14.6671 28.5567 14.2925C28.5535 13.9179 28.4032 13.5596 28.1383 13.2947C27.8734 13.0298 27.5151 12.8795 27.1405 12.8763C26.7659 12.873 26.405 13.017 26.1355 13.2773L15.7159 23.6969L12.4398 20.4209C12.1704 20.1606 11.8095 20.0166 11.4349 20.0199C11.0603 20.0231 10.7019 20.1734 10.437 20.4383C10.1721 20.7032 10.0219 21.0615 10.0186 21.4361C10.0154 21.8107 10.1594 22.1716 10.4196 22.4411L14.7058 26.7272C14.9737 26.9951 15.337 27.1455 15.7159 27.1455C16.0947 27.1455 16.4581 26.9951 16.726 26.7272L28.1557 15.2975Z" fill="currentColor"/>
	</svg>
`;

let defaultPaymentProofIcon = "";

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
			let value = detailsValue?.querySelector("span")?.textContent.trim();

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

function getFileExtension(filename) {
	return filename.split(".").pop()?.toLowerCase() ?? "";
}

async function hasValidFileSignature(file, extension) {
	const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());

	if (extension === "jpg" || extension === "jpeg") {
		return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
	}

	if (extension === "png") {
		const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
		return pngSignature.every((byte, index) => bytes[index] === byte);
	}

	if (extension === "pdf") {
		const pdfSignature = [0x25, 0x50, 0x44, 0x46, 0x2d];
		return pdfSignature.every((byte, index) => bytes[index] === byte);
	}

	return false;
}

function showPaymentProofStatus(message, isError = false) {
	const status = document.querySelector(".proof__status");
	if (!status) return;

	status.textContent = message;
	status.classList.toggle("proof__status--error", isError);
}

function updatePaymentProofButton(hasFile) {
	const button = document.querySelector(".proof__button");
	if (!button) return;

	button.textContent = hasFile ? "Odebrat" : "Nahrát";
}

function updatePaymentProofIcon(hasFile) {
	const icon = document.querySelector(".proof label > svg");
	if (!icon) return;

	icon.outerHTML = hasFile
		? ATTACHED_PAYMENT_PROOF_ICON
		: defaultPaymentProofIcon;
}

function removePaymentProof() {
	const input = document.getElementById("payment_proof");
	if (!input) return;

	input.value = "";
	showPaymentProofStatus("Potvrzení o platbě");
	updatePaymentProofButton(false);
	updatePaymentProofIcon(false);
}

async function validatePaymentProof() {
	const input = document.getElementById("payment_proof");
	const file = input?.files?.[0];

	if (!input || !file) {
		showPaymentProofStatus("Přiložte potvrzení o platbě.", true);
		updatePaymentProofButton(false);
		updatePaymentProofIcon(false);
		return false;
	}

	const extension = getFileExtension(file.name);
	const expectedType = PAYMENT_PROOF_TYPES[extension];
	let errorMessage = "";

	if (!expectedType || file.type !== expectedType) {
		errorMessage = "Povolené formáty jsou JPG, PNG a PDF.";
	} else if (file.size > MAX_PAYMENT_PROOF_SIZE) {
		errorMessage = "Soubor může mít maximálně 5 MB.";
	} else if (!(await hasValidFileSignature(file, extension))) {
		errorMessage = "Obsah souboru neodpovídá jeho formátu.";
	}

	if (errorMessage) {
		input.value = "";
		showPaymentProofStatus(errorMessage, true);
		updatePaymentProofButton(false);
		updatePaymentProofIcon(false);
		return false;
	}

	showPaymentProofStatus(file.name);
	updatePaymentProofButton(true);
	updatePaymentProofIcon(true);
	return true;
}

function initializePaymentProof() {
	const input = document.getElementById("payment_proof");
	const button = document.querySelector(".proof__button");
	const icon = document.querySelector(".proof label > svg");
	defaultPaymentProofIcon = icon?.outerHTML ?? "";
	const handleButtonAction = (event) => {
		event.preventDefault();
		event.stopPropagation();

		if (input?.files?.length) {
			removePaymentProof();
		} else {
			input?.click();
		}
	};

	input?.addEventListener("change", validatePaymentProof);
	button?.addEventListener("click", handleButtonAction);
	button?.addEventListener("keydown", (event) => {
		if (event.key === "Enter" || event.key === " ") {
			handleButtonAction(event);
		}
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

	if (typeof turnstile === "undefined") {
		alert(
			"Bezpečnostní ověření se nepodařilo načíst. Obnovte stránku a zkuste to znovu.",
		);
		return false;
	}

	const token = turnstile.getResponse();
	if (!token) {
		alert("Probíhá bezpečnostní ověření. Počkejte chvíli a zkuste to znovu.");
		return false;
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
		"#step-2 .preview__row span:last-child",
	);

	previewValues[0].textContent = selectedPlan.validity;
	previewValues[1].textContent = selectedPlan.price;

	const detailValues = document.querySelectorAll(
		"#step-2 .details .details__value span",
	);

	detailValues[3].textContent = selectedPlan.price;
	detailValues[4].textContent = `${lastName}, ${selectedPlan.validity}`;
}

function updateConfirmationEmail() {
	const email = document.getElementById("email")?.value;
	const output = document.querySelector("#step-3 fieldset:first-of-type p b");

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
	history.replaceState({ step: targetStep }, "", `#step${targetStep}`);
}

function setSubmittingState(submitting) {
	isSubmitting = submitting;

	const submitButton = document.getElementById("submit-payment");
	if (!submitButton) return;

	submitButton.disabled = submitting;
	submitButton.textContent = submitting ? "Odesíláme…" : "Zaplaceno";
	submitButton.setAttribute("aria-busy", String(submitting));
}

async function submitForm() {
	if (isSubmitting) return;
	setSubmittingState(true);

	try {
		if (!(await validatePaymentProof())) return;
		if (!isSecurityVerified()) return;

		const form = document.getElementById("reg");
		if (!form) return;

		const honeypot =
			document.querySelector('input[name="website"]')?.value || "";
		const token = turnstile.getResponse();
		const formData = new FormData(form);
		formData.set("website", honeypot);
		formData.set("cf-turnstile-response", token);

		const response = await fetch("/api/submit", {
			method: "POST",
			body: formData,
		});
		const result = await response.json();

		if (!response.ok || !result.success) {
			alert(
				result.error || "Registraci se nepodařilo odeslat. Zkuste to znovu.",
			);
			if (typeof turnstile !== "undefined") turnstile.reset();
			return;
		}

		isFormDirty = false;
		updateConfirmationEmail();
		goToStep(3);
	} catch (error) {
		console.error("Registration submission failed:", error);
		alert("Server není dostupný. Zkuste to prosím znovu.");
		if (typeof turnstile !== "undefined") turnstile.reset();
	} finally {
		setSubmittingState(false);
	}
}

function handlePopState() {
	history.replaceState({ step: currentStep }, "", `#step${currentStep}`);
	renderStep(currentStep);
}

function handleBeforeUnload(event) {
	if (!isFormDirty || currentStep === 3) return;

	event.preventDefault();
	event.returnValue = "";
}

function resetRegistrationForm() {
	const form = document.getElementById("reg");
	form?.reset();
	removePaymentProof();
	setSubmittingState(false);
	isFormDirty = false;
	currentStep = 1;
	renderStep(currentStep);
	history.replaceState({ step: currentStep }, "", "#step1");
}

function handlePageShow() {
	resetRegistrationForm();
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
	initializePaymentProof();

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

	resetRegistrationForm();
}

window.addEventListener("DOMContentLoaded", initializeForm);
window.addEventListener("popstate", handlePopState);
window.addEventListener("beforeunload", handleBeforeUnload);
window.addEventListener("pageshow", handlePageShow);

window.goToStep = goToStep;
window.submitForm = submitForm;
window.onTurnstileError = handleTurnstileError;
window.onTurnstileExpired = handleTurnstileExpired;

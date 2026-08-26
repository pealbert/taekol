import { neon } from "@neondatabase/serverless";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_REQUEST_SIZE = 6 * 1024 * 1024;
const EXPECTED_TURNSTILE_ACTION = "registration";

const FILE_TYPES = {
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	png: "image/png",
	pdf: "application/pdf",
};

const MEMBERSHIPS = {
	start: { amountCzk: 2000, validityMonths: 3 },
	pololetni: { amountCzk: 3750, validityMonths: 5 },
	rocni: { amountCzk: 6500, validityMonths: 10 },
};

const CATEGORIES = new Set([
	"mirne-pokrocili-4-6",
	"mirne-pokrocili-7-9",
	"zacatecnici-8-14",
	"pokracujici-14-18",
	"dospeli-18-plus",
]);

class ValidationError extends Error {}

function json(data, status = 200) {
	return Response.json(data, {
		status,
		headers: {
			"Cache-Control": "no-store",
			"X-Content-Type-Options": "nosniff",
		},
	});
}

function getText(formData, name, { required = false, maxLength } = {}) {
	const rawValue = formData.get(name);
	if (rawValue !== null && typeof rawValue !== "string") {
		throw new ValidationError(`Neplatná hodnota pole ${name}.`);
	}

	const value = rawValue?.trim() ?? "";
	if (required && !value) {
		throw new ValidationError(`Pole ${name} je povinné.`);
	}
	if (maxLength && value.length > maxLength) {
		throw new ValidationError(`Pole ${name} je příliš dlouhé.`);
	}

	return value;
}

function validateRegistration(formData) {
	const firstName = getText(formData, "first_name", {
		required: true,
		maxLength: 100,
	});
	const lastName = getText(formData, "last_name", {
		required: true,
		maxLength: 100,
	});
	const birthDate = getText(formData, "birth_date", {
		required: true,
		maxLength: 10,
	});
	const email = getText(formData, "email", {
		required: true,
		maxLength: 255,
	}).toLowerCase();
	const phone = getText(formData, "phone", {
		required: true,
		maxLength: 30,
	});
	const category = getText(formData, "category", {
		required: true,
		maxLength: 50,
	});
	const membership = getText(formData, "membership_validity", {
		required: true,
		maxLength: 20,
	});
	const source = getText(formData, "source", { maxLength: 100 });
	const note = getText(formData, "note", { maxLength: 500 });

	if (!/^[\p{L}\s'-]{3,100}$/u.test(firstName)) {
		throw new ValidationError("Jméno není platné.");
	}
	if (!/^[\p{L}\s'-]{3,100}$/u.test(lastName)) {
		throw new ValidationError("Příjmení není platné.");
	}
	if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
		throw new ValidationError("Datum narození není platné.");
	}

	const parsedBirthDate = new Date(`${birthDate}T00:00:00Z`);
	if (
		Number.isNaN(parsedBirthDate.getTime()) ||
		parsedBirthDate.toISOString().slice(0, 10) !== birthDate ||
		birthDate <= "1900-01-01" ||
		parsedBirthDate > new Date()
	) {
		throw new ValidationError("Datum narození není platné.");
	}
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		throw new ValidationError("E-mail není platný.");
	}
	if (phone.replace(/\D/g, "").length !== 12) {
		throw new ValidationError("Telefonní číslo není platné.");
	}
	if (!CATEGORIES.has(category)) {
		throw new ValidationError("Kategorie není platná.");
	}
	if (!Object.hasOwn(MEMBERSHIPS, membership)) {
		throw new ValidationError("Typ členství není platný.");
	}
	if (formData.get("terms") !== "on") {
		throw new ValidationError("Musíte souhlasit s podmínkami.");
	}

	return {
		firstName,
		lastName,
		birthDate,
		email,
		phone,
		category,
		membership,
		source: source || null,
		note: note || null,
	};
}

function getExtension(filename) {
	return filename.split(".").pop()?.toLowerCase() ?? "";
}

async function validatePaymentProof(formData) {
	const file = formData.get("payment_proof");
	if (!(file instanceof File) || file.size === 0) {
		throw new ValidationError("Přiložte potvrzení o platbě.");
	}
	if (file.size > MAX_FILE_SIZE) {
		throw new ValidationError("Soubor může mít maximálně 5 MB.");
	}

	const extension = getExtension(file.name);
	const expectedType = FILE_TYPES[extension];
	if (!expectedType || file.type !== expectedType) {
		throw new ValidationError("Povolené formáty jsou JPG, PNG a PDF.");
	}

	const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
	const signatures = {
		jpeg: [0xff, 0xd8, 0xff],
		png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
		pdf: [0x25, 0x50, 0x44, 0x46, 0x2d],
	};
	const signature =
		extension === "jpg" || extension === "jpeg"
			? signatures.jpeg
			: signatures[extension];

	if (!signature.every((byte, index) => bytes[index] === byte)) {
		throw new ValidationError("Obsah souboru neodpovídá jeho formátu.");
	}

	return { file, extension };
}

async function verifyTurnstile(request, env, token) {
	const expectedHostnames = new Set(
		(env.TURNSTILE_HOSTNAMES ?? "")
			.split(",")
			.map((hostname) => hostname.trim())
			.filter(Boolean),
	);

	if (
		!env.TURNSTILE_SECRET ||
		!token ||
		token.length > 2048 ||
		expectedHostnames.size === 0
	) {
		console.warn({
			event: "turnstile_configuration_invalid",
			hasSecret: Boolean(env.TURNSTILE_SECRET),
			hasToken: Boolean(token),
			tokenLengthIsValid: Boolean(token && token.length <= 2048),
			expectedHostnameCount: expectedHostnames.size,
		});
		return false;
	}

	try {
		const response = await fetch(
			"https://challenges.cloudflare.com/turnstile/v0/siteverify",
			{
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				signal: AbortSignal.timeout(10_000),
				body: new URLSearchParams({
					secret: env.TURNSTILE_SECRET,
					response: token,
					remoteip: request.headers.get("CF-Connecting-IP") ?? "",
				}),
			},
		);

		if (!response.ok) {
			console.warn({
				event: "turnstile_siteverify_http_error",
				status: response.status,
			});
			return false;
		}

		const result = await response.json();
		const isValid =
			result.success === true &&
			result.action === EXPECTED_TURNSTILE_ACTION &&
			expectedHostnames.has(result.hostname);

		if (!isValid) {
			console.warn({
				event: "turnstile_verification_failed",
				errorCodes: Array.isArray(result["error-codes"])
					? result["error-codes"]
					: [],
				action: typeof result.action === "string" ? result.action : null,
				hostname: typeof result.hostname === "string" ? result.hostname : null,
			});
		}

		return isValid;
	} catch (error) {
		console.warn({
			event: "turnstile_siteverify_request_failed",
			message: error instanceof Error ? error.message : "Unknown error",
		});
		return false;
	}
}

async function submitRegistration(request, env) {
	const contentType = request.headers.get("Content-Type") ?? "";
	if (!contentType.startsWith("multipart/form-data")) {
		return json({ error: "Neplatný formát požadavku." }, 415);
	}

	const contentLength = Number(request.headers.get("Content-Length"));
	if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_SIZE) {
		return json({ error: "Odesílaný soubor je příliš velký." }, 413);
	}

	let objectKey;
	try {
		const formData = await request.formData();

		if (getText(formData, "website")) {
			return json({ error: "Požadavek byl odmítnut." }, 400);
		}

		const token = getText(formData, "cf-turnstile-response", {
			required: true,
			maxLength: 2048,
		});
		if (!(await verifyTurnstile(request, env, token))) {
			return json({ error: "Bezpečnostní ověření selhalo." }, 403);
		}

		const registration = validateRegistration(formData);
		const { file, extension } = await validatePaymentProof(formData);
		const membership = MEMBERSHIPS[registration.membership];
		const uploadId = crypto.randomUUID();
		objectKey = `payment-proofs/${new Date().getUTCFullYear()}/${uploadId}.${extension}`;

		await env.PAYMENT_PROOFS.put(objectKey, file.stream(), {
			httpMetadata: {
				contentType: file.type,
				contentDisposition: "attachment",
			},
			customMetadata: { uploadId },
		});

		const sql = neon(env.DATABASE_URL);
		const [createdMembership] = await sql`
			WITH new_member AS (
				INSERT INTO public.members (
					first_name,
					last_name,
					birth_date,
					email,
					phone,
					location,
					source,
					note,
					consent_version,
					consent_accepted_at
				) VALUES (
					${registration.firstName},
					${registration.lastName},
					${registration.birthDate},
					${registration.email},
					${registration.phone},
					${"Olomouc"},
					${registration.source},
					${registration.note},
					${"v1.0"},
					CURRENT_TIMESTAMP
				)
				RETURNING id
			)
			INSERT INTO public.memberships (
				member_id,
				category,
				pay_amount,
				currency,
				payment_proof_url,
				status,
				membership_validity,
				validity_ends_at
			)
			SELECT
				id,
				${registration.category},
				${membership.amountCzk},
				${"CZK"},
				${objectKey},
				${"pending"},
				${registration.membership},
				(CURRENT_DATE + make_interval(months => ${membership.validityMonths}))::date
			FROM new_member
			RETURNING id
		`;

		return json({ success: true, membershipId: createdMembership.id }, 201);
	} catch (error) {
		if (objectKey) {
			try {
				await env.PAYMENT_PROOFS.delete(objectKey);
			} catch (cleanupError) {
				console.error({
					event: "payment_proof_cleanup_failed",
					message:
						cleanupError instanceof Error
							? cleanupError.message
							: "Unknown error",
				});
			}
		}

		if (error instanceof ValidationError) {
			return json({ error: error.message }, 400);
		}
		if (error?.code === "23505" && error?.constraint === "members_email_key") {
			return json({ error: "Tento e-mail je již zaregistrován." }, 409);
		}

		console.error({
			event: "registration_submission_failed",
			message: error instanceof Error ? error.message : "Unknown error",
		});
		return json({ error: "Registraci se nepodařilo uložit." }, 500);
	}
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		if (url.pathname === "/api/submit") {
			if (request.method !== "POST") {
				return json({ error: "Metoda není povolena." }, 405);
			}
			return submitRegistration(request, env);
		}

		if (url.pathname.startsWith("/api/")) {
			return json({ error: "API endpoint nebyl nalezen." }, 404);
		}

		return env.ASSETS.fetch(request);
	},
};

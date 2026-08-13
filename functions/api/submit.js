export async function onRequestPost(context) {
	const { request, env } = context;

	try {
		const body = await request.json();
		const { token, honeypot } = body;

		// 1. Honeypot check
		if (honeypot) {
			return new Response(JSON.stringify({ error: "Spam detected" }), {
				status: 400,
			});
		}

		// 2. Verify Turnstile token with Cloudflare
		const verifyFormData = new FormData();
		verifyFormData.append("secret", env.TURNSTILE_SECRET_KEY);
		verifyFormData.append("response", token);

		const turnstileRes = await fetch(
			"https://challenges.cloudflare.com/turnstile/v0/siteverify",
			{
				method: "POST",
				body: verifyFormData,
			},
		);

		const outcome = await turnstileRes.json();

		if (!outcome.success) {
			return new Response(
				JSON.stringify({ error: "Invalid CAPTCHA verification" }),
				{ status: 400 },
			);
		}

		// 3. Verification passed! Insert into Neon DB here
		// await db.query(...);

		return new Response(JSON.stringify({ success: true }), { status: 200 });
	} catch (err) {
		return new Response(JSON.stringify({ error: err.message }), {
			status: 500,
		});
	}
}

// import { neon } from '@neondatabase/serverless';

// export async function onRequest(context) {
// 	const sql = neon(context.env.DATABASE_URL);

// 	const rows = await sql`SELECT * FROM registrations WHERE variable_symbol = ${'18'}`;

// 	return new Response(JSON.stringify(rows), {
// 		headers: {
// 			'Content-Type': 'application/json'
// 		}
// 	});
// }

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
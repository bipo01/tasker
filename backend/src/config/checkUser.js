import db from "./db.js";

export async function isAdmin(table, id, req) {
	const result = await db.query(`SELECT 1 FROM ${table} WHERE id = $1 AND admins_id @> ARRAY[$2::int]`, [id, req.user.id]);
	const { rowCount } = result;

	console.log(!!rowCount);

	return !!rowCount;
}

export async function isUser(table, id, req) {
	const result = await db.query(`SELECT 1 FROM ${table} WHERE id = $1 AND users_id @> ARRAY[$2::int]`, [id, req.user.id]);
	const { rowCount } = result;

	console.log(!!rowCount);

	return !!rowCount;
}

export async function isCreator(table, id, req) {
	const result = await db.query(`SELECT 1 FROM ${table} WHERE id = $1 AND creator_id = $2`, [id, req.user.id]);
	const { rowCount } = result;

	console.log(!!rowCount);

	return !!rowCount;
}

import { signUser } from "../config/auth.js";
import db from "../config/db.js";

export async function signIn(req, res) {
	const { username, password } = req.body;
	const userExist = await db.query("SELECT * FROM fs_tasker_users WHERE username = $1 OR email = $1", [username]);
	const user = userExist.rows[0];

	if (!user) return res.status(404).json({ message: "User not found" });
	if (user.password !== password) return res.status(403).json({ message: "Wrong password" });

	signUser(req, res, user);

	return res.status(200).json({ message: "Logged in" });
}

export async function signUp(req, res) {
	const { name, email, username, password } = req.body;

	try {
		const userExistResult = await db.query("SELECT * FROM fs_tasker_users WHERE username = $1 OR email = $2", [username, email]);
		const userExist = userExistResult.rows[0];

		if (userExist) {
			if (userExist.username === username && userExist.email === email) return res.status(500).json({ message: "There's someone already using this email and this username" });
			if (userExist.username === username) return res.status(500).json({ message: "There's someone already using this username" });
			if (userExist.email === email) return res.status(500).json({ message: "There's someone already using this email" });
		}

		const userResult = await db.query("INSERT INTO fs_tasker_users (name, email, username, password) VALUES($1,$2,$3,$4) RETURNING *", [name, email, username, password]);
		const user = userResult.rows[0];

		if (user) signUser(req, res, user);

		return res.status(201).json({ message: "User created" });
	} catch (error) {
		return res.status(500).json({ message: "Something went wrong" });
	}
}

export async function logOut(req, res) {
	try {
		await res.clearCookie("token");
		return res.status(200).json({ message: "Logged out" });
	} catch (error) {
		return res.status(500).json({ message: "Could not clear the token" });
	}
}

export function checkAuth(req, res) {
	return res.status(200).json({ ...req.user });
}

export async function getNotifications(req, res) {
	const wsInvitationsResult = await db.query("SELECT * FROM fs_tasker_workspaces_invitations WHERE receiver_id = $1 AND seen = false", [req.user.id]);
	const wsInvitations = wsInvitationsResult.rows;

	const notificationsResult = await db.query("SELECT * FROM fs_tasker_notifications WHERE receiver_id = $1 ORDER BY id DESC", [req.user.id]);
	const notifications = notificationsResult.rows;

	const data = { wsInvitations, notifications };

	return res.status(200).json(data);
}

export async function deleteNotification(req, res) {
	const { id } = req.params;

	const notificationResult = await db.query("DELETE FROM fs_tasker_notifications WHERE id = $1 AND receiver_id = $2 RETURNING *", [id, req.user.id]);
	const notification = notificationResult.rows[0];

	if (!notification) return res.status(403).json({ message: "Notificação não encontrada" });

	return res.status(201).json(notification);
}
export async function toggleSeen(req, res) {
	const { id } = req.body;

	const notificationResult = await db.query(
		`
		UPDATE fs_tasker_notifications SET seen =
		CASE WHEN seen = false
		THEN true
		ELSE false
		END
		WHERE id = $1 AND receiver_id = $2 RETURNING *
		`,
		[id, req.user.id],
	);
	const notification = notificationResult.rows[0];

	if (!notification) return res.status(403).json({ message: "Notificação não encontrada" });

	return res.status(201).json(notification);
}

export async function findUsers(req, res) {
	const value = req.query.value.trim();
	const usersResult = await db.query("SELECT id, name, username FROM fs_tasker_users WHERE name ILIKE '%' || $1 || '%' OR username ILIKE '%' || $1 || '%'", [value]);
	const users = usersResult.rows;

	res.status(200).json(users);
}

export async function getData(req, res) {
	const { rowCount: workspaces } = await db.query("SELECT * FROM fs_tasker_workspaces WHERE users_id @> ARRAY[$1::int]", [req.user.id]);
	const { rowCount: projects } = await db.query("SELECT * FROM fs_tasker_projects WHERE users_id @> ARRAY[$1::int]", [req.user.id]);
	const { rowCount: tasks } = await db.query("SELECT * FROM fs_tasker_tasks WHERE owners_id @> ARRAY[$1::int]", [req.user.id]);

	return res.status(200).json({ workspaces, projects, tasks });
}

export async function editProfile(req, res) {
	let name = req.body.name.trim();
	const username = req.body.username.trim();
	const email = req.body.email.trim();

	name = name.replace(/\s+/g, " ");

	const nameArr = name.split(" ").map((el) => {
		return `${el.at(0).toUpperCase()}${el.slice(1)}`;
	});
	name = nameArr.join(" ");

	if (username.split(" ").length > 1) return res.status(500).json({ message: "O nome de usuário não pode conter espaços" });

	if (!email.includes("@")) return res.status(500).json({ message: "Forneça um email válido" });

	const { rowCount: userExist } = await db.query("SELECT * FROM fs_tasker_users WHERE username = $1 AND id <> $2", [username, req.user.id]);
	if (userExist) return res.status(500).json({ message: "Nome de usuário já existe" });

	const updatedUserResult = await db.query("UPDATE fs_tasker_users SET name = $1, username = $2, email = $3 WHERE id = $4 RETURNING *", [name, username, email, req.user.id]);
	const updatedUser = updatedUserResult.rows[0];

	if (updatedUser) signUser(req, res, updatedUser);

	return res.status(201).json(updatedUser);
}

export async function changePassword(req, res) {
	const currentPasswordValue = req.body.currentPasswordValue.trim();
	const newPasswordValue = req.body.newPasswordValue.trim();
	const confirmNewPasswordValue = req.body.confirmNewPasswordValue.trim();

	if ([currentPasswordValue, newPasswordValue, confirmNewPasswordValue].some((el) => el.includes(" "))) {
		return res.status(500).json({ message: "As senhas não podem conter espaços" });
	}

	if ([newPasswordValue, confirmNewPasswordValue].some((el) => el.length < 4)) {
		return res.status(500).json({ message: "As senhas devem ter pelo menos 4 caracteres" });
	}

	if (newPasswordValue !== confirmNewPasswordValue) return res.status(500).json({ message: "As senhas devem conferir uma com a outra" });

	const userResult = await db.query("SELECT * FROM fs_tasker_users WHERE id = $1", [req.user.id]);
	const user = userResult.rows[0];

	if (user.password !== currentPasswordValue) return res.status(500).json({ message: "Sua senha atual não está correta" });

	const updatedUserResult = await db.query("UPDATE fs_tasker_users SET password = $1 WHERE id = $2 RETURNING *", [newPasswordValue, req.user.id]);
	const updatedUser = updatedUserResult.rows[0];

	if (updatedUser) signUser(req, res, updatedUser);

	return res.status(201).json(updatedUser);
}

export async function deleteAccount(req, res) {
	await db.query("DELETE FROM fs_tasker_users WHERE id = $1", [req.user.id]);

	await res.clearCookie("token");

	return res.status(204).json({ message: "DELETED" });
}

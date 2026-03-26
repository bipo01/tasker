import { io } from "../../server.js";
import db from "../config/db.js";

export async function getWorkspaces(req, res) {
	const workspacesResult = await db.query("SELECT * FROM fs_tasker_workspaces WHERE users_id @> ARRAY[$1::int] ORDER BY id ASC", [req.user.id]);
	const workspaces = workspacesResult.rows;

	res.status(200).json(workspaces);
}

export async function getWorkspace(req, res) {
	const id = Number(req.params.id);

	try {
		const workspaceResult = await db.query("SELECT * FROM fs_tasker_workspaces WHERE users_id @> ARRAY[$1::int] AND id = $2", [req.user.id, id]);
		const workspace = workspaceResult.rows[0];

		if (workspace) {
			let query;
			let values;

			// query = `SELECT * FROM fs_tasker_projects WHERE (workspace_id = $1 AND users_id @> ARRAY[$2::int]) OR (workspace_id = $1 AND private = false) ORDER BY id ASC`;
			// values = [workspace.id, req.user.id];

			query = `SELECT * FROM fs_tasker_projects WHERE workspace_id = $1 ORDER BY id ASC`;
			values = [workspace.id];

			const projectsResult = await db.query(query, values);
			const isWorkspaceAdmin = workspace.admins_id.includes(req.user.id);
			let projects = projectsResult.rows.filter((project) => {
				if (!project.private) return true;

				if (isWorkspaceAdmin) return true;

				if (project.admins_id.includes(req.user.id) || project.users_id.includes(req.user.id)) {
					return true;
				}
			});

			const usersResult = await db.query("SELECT id, username, name, email FROM fs_tasker_users WHERE id = ANY($1)", [workspace.users_id]);
			const users = usersResult.rows;

			const invitationsResult = await db.query("SELECT * FROM fs_tasker_workspaces_invitations WHERE workspace_id = $1", [workspace.id]);
			const invitations = invitationsResult.rows;

			return res.status(200).json({ ...workspace, projects, users, invitations });
		}

		res.status(500).json({ message: "Workspace não existe no seu repertório" });
	} catch (error) {
		res.status(500).json({ message: "Algo deu errado..." });
	}
}

export async function createWorkspace(req, res) {
	console.log(req.body);
	const { title, description } = req.body;
	if (!title.trim() || !description.trim()) return res.status(500).json({ message: "Por favor, preencha todos os dados..." });

	try {
		const newWorkspaceResult = await db.query("INSERT INTO fs_tasker_workspaces (title, description, creator_id, admins_id, users_id) VALUES($1,$2,$3,$4,$5) RETURNING *", [title, description, req.user.id, [req.user.id], [req.user.id]]);

		const newWorkspace = newWorkspaceResult.rows[0];

		io.to(`user-${req.user.id}`).emit("add-workspace", newWorkspace);

		return res.status(201).json(newWorkspace);
	} catch (error) {
		return res.status(500).json({ message: "Não foi possível criar o workspace no momento... Tente novamente mais tarde." });
	}
}

export async function deleteWorkspace(req, res) {
	const { id } = req.params;
	console.log(id);

	try {
		const workspaceResult = await db.query("DELETE FROM fs_tasker_workspaces WHERE creator_id = $1 AND id = $2 RETURNING *", [req.user.id, id]);
		const workspace = workspaceResult.rows[0];

		if (!workspace) return res.status(403).json({ message: "Não foi possível concluir a ação de deletar" });

		for (const user_id of workspace.users_id) {
			io.to(`user-${user_id}`).emit("delete-workspace", workspace);
		}

		return res.status(200).json(workspace);
	} catch (error) {
		return res.status(500).json({ message: "Algo deu errado ao tentar deletar esse workspace" });
	}
}

export async function isCreator(req, res) {
	const id = Number(req.params.id);

	const workspaceResult = await db.query("SELECT * FROM fs_tasker_workspaces WHERE id = $1 AND creator_id = $2", [id, req.user.id]);
	const workspace = workspaceResult.rows[0];

	if (!workspace) return res.status(403).json({ message: "Não é possível editar esse workspace" });

	return res.status(200).json(workspace);
}

export async function updateWorkspace(req, res) {
	const { id } = req.params;
	let { title, description } = req.body;

	const workspaceResult = await db.query("SELECT * FROM fs_tasker_workspaces WHERE id = $1 AND creator_id = $2", [id, req.user.id]);
	const workspace = workspaceResult.rows[0];

	if (!workspace) return res.status(403).json({ message: "Não foi possível atualizar esse workspace" });

	title = title.trim() || workspace.title;
	description = description.trim() || workspace.description;

	const updatedWorkspaceResult = await db.query("UPDATE fs_tasker_workspaces SET title = $1, description = $2 WHERE id = $3 RETURNING *", [title, description, id]);
	const updatedWorkspace = updatedWorkspaceResult.rows[0];

	for (const user_id of workspace.users_id) {
		io.to(`user-${user_id}`).emit("update-workspaces", updatedWorkspace);
	}

	return res.status(201).json(updatedWorkspace);
}

export async function inviteMember(req, res) {
	const { id } = req.params;

	const workspaceResult = await db.query("SELECT * FROM fs_tasker_workspaces WHERE id = $1 AND admins_id @> ARRAY[$2::int]", [id, req.user.id]);
	const workspace = workspaceResult.rows[0];

	if (!workspace) return res.status(403).json({ message: "Não foi possível alterar esse workspace" });

	const userId = req.body.userId;
	const username = req.body.username.trim();

	const userResult = await db.query(`SELECT id FROM fs_tasker_users WHERE id = $1 AND username = $2`, [userId, username]);
	const user = userResult.rows[0];

	if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
	if (user.id === req.user.id) return res.status(403).json({ message: "Você não pode enviar convite para esse usuário" });

	if (workspace.users_id.includes(user.id)) return res.status(403).json({ message: "Usuário já está no workspace" });
	const invitationsResult = await db.query("SELECT * FROM fs_tasker_workspaces_invitations WHERE receiver_id = $1 AND workspace_id = $2", [user.id, id]);
	const invitations = invitationsResult.rows[0];

	if (invitations) return res.status(200).json(invitations);

	const invitationResult = await db.query("INSERT INTO fs_tasker_workspaces_invitations (sender_id, receiver_id, workspace_id, seen, sender_name, sender_username, workspace_title) VALUES($1,$2,$3, false,$4,$5,$6) RETURNING *", [req.user.id, user.id, id, req.user.name, req.user.username, workspace.title]);
	const invitation = invitationResult.rows[0];

	io.to(`user-${user.id}`).emit("notificate", invitation);

	return res.status(201).json(invitation);
}

export async function uninviteMember(req, res) {
	const { id } = req.params;

	const workspaceResult = await db.query("SELECT * FROM fs_tasker_workspaces WHERE id = $1 AND admins_id @> ARRAY[$2::int]", [id, req.user.id]);
	const workspace = workspaceResult.rows[0];

	if (!workspace) return res.status(403).json({ message: "Não foi possível alterar esse workspace" });

	const userId = req.body.userId;
	const username = req.body.username.trim();

	const userResult = await db.query(`SELECT id FROM fs_tasker_users WHERE id = $1 AND username = $2`, [userId, username]);
	const user = userResult.rows[0];

	if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
	if (user.id === req.user.id) return res.status(403).json({ message: "Você não pode enviar convite para esse usuário" });

	const deletedInvitationResult = await db.query("DELETE FROM fs_tasker_workspaces_invitations WHERE receiver_id = $1 AND workspace_id = $2 RETURNING *", [user.id, workspace.id]);
	const deletedInvitation = deletedInvitationResult.rows[0];

	res.status(200).json(deletedInvitation);
}

export async function removeMember(req, res) {
	const id = Number(req.params.id);

	const workspaceResult = await db.query("SELECT * FROM fs_tasker_workspaces WHERE id = $1 AND creator_id = $2", [id, req.user.id]);
	const workspace = workspaceResult.rows[0];

	if (!workspace) return res.status(403).json({ message: "Não foi possível editar esse workspace" });

	const userId = Number(req.body.userId);

	const updatedWorkspaceResult = await db.query("UPDATE fs_tasker_workspaces SET users_id = ARRAY_REMOVE(users_id, $1), admins_id = ARRAY_REMOVE(admins_id, $1) WHERE id = $2 RETURNING *", [userId, id]);
	const updatedWorkspace = updatedWorkspaceResult.rows[0];

	io.to(`user-${userId}`).emit("delete-workspace", updatedWorkspace);

	return res.status(200).json(updatedWorkspace);
}

export async function updateAdmin(req, res) {
	const id = Number(req.params.id);

	const workspaceResult = await db.query("SELECT * FROM fs_tasker_workspaces WHERE id = $1 AND creator_id = $2", [id, req.user.id]);
	const workspace = workspaceResult.rows[0];

	if (!workspace) return res.status(403).json({ message: "Não foi possível editar esse workspace" });

	const userId = Number(req.body.userId);

	if (!workspace.users_id.includes(userId)) return res.status(403).json({ message: "Esse usuário não faz parte do workspace" });

	const updatedWorkspaceResult = await db.query(
		`
		UPDATE fs_tasker_workspaces SET admins_id = 
		CASE
		WHEN ARRAY_POSITION(admins_id, $1) IS NOT NULL
		THEN ARRAY_REMOVE(admins_id, $1)
		ELSE ARRAY_APPEND(admins_id, $1)
		END
		WHERE id = $2 RETURNING *`,
		[userId, id],
	);
	const updatedWorkspace = updatedWorkspaceResult.rows[0];

	io.to(`user-${userId}`).emit("update-workspaces", updatedWorkspace);

	return res.status(200).json(updatedWorkspace);
}

export async function handleInvitation(req, res) {
	const id = Number(req.body.id);
	const action = req.body.action;

	const invitationResult = await db.query("SELECT * FROM fs_tasker_workspaces_invitations WHERE receiver_id = $1 AND id = $2", [req.user.id, id]);
	const invitation = invitationResult.rows[0];

	if (!invitation) return res.status(404).json({ message: "Convite não encontrado para esse usuário" });

	if (action !== "accept" && action !== "reject") return res.status(404).json({ message: "Essa ação não pode ser feita" });

	if (action === "accept") {
		await db.query("UPDATE fs_tasker_workspaces SET users_id = ARRAY_APPEND(users_id, $1) WHERE id = $2", [req.user.id, invitation.workspace_id]);

		await db.query("DELETE FROM fs_tasker_workspaces_invitations WHERE id = $1", [invitation.id]);
	} else {
		await db.query("DELETE FROM fs_tasker_workspaces_invitations WHERE id = $1", [invitation.id]);
	}

	return res.status(200).json({ message: "OK" });
}

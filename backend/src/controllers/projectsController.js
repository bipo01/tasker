import { io } from "../../server.js";

import db from "../config/db.js";

export async function getProjects(req, res) {
	const projectsResult = await db.query(
		`
		SELECT * FROM fs_tasker_projects WHERE users_id @> ARRAY[$1::int] ORDER BY id ASC
		`,
		[req.user.id],
	);

	const projects = projectsResult.rows;

	return res.status(200).json(projects);
}

export async function getProject(req, res) {
	const { id } = req.params;

	const projectResult = await db.query("SELECT * FROM fs_tasker_projects WHERE id = $1", [id]);
	const project = projectResult.rows[0];

	if (!project) return res.status(404).json({ message: "Não foi possível acessar esse projeto" });

	if (project.private) {
		if (!project.users_id.includes(req.user.id)) return res.status(403).json({ message: "Não foi possível acessar esse projeto" });
	} else {
		const workspaceResult = await db.query("SELECT * FROM fs_tasker_workspaces WHERE id = $1 AND users_id @> ARRAY[$2::int]", [project.workspace_id, req.user.id]);
		const workspace = workspaceResult.rows[0];

		if (!workspace) return res.status(404).json({ message: "Não foi possível acessar esse projeto" });
	}

	return res.status(200).json(project);
}

export async function getTasksFromProject(req, res) {
	const { id } = req.params;

	const projectResult = await db.query("SELECT * FROM fs_tasker_projects WHERE id = $1", [id]);
	const project = projectResult.rows[0];

	if (!project) return res.status(404).json({ message: "Não foi possível carregar as tarefas desse projeto" });

	const workspaceResult = await db.query("SELECT * FROM fs_tasker_workspaces WHERE id = $1 AND users_id @> ARRAY[$2::int]", [project.workspace_id, req.user.id]);
	const workspace = workspaceResult.rows[0];

	if (!workspace) return res.status(404).json({ message: "Não foi possível carregar as tarefas desse projeto" });

	if (project.private && !workspace.admins_id.includes(req.user.id) && !project.users_id.includes(req.user.id)) return res.status(404).json({ message: "Não foi possível carregar as tarefas desse projeto" });

	const isAdmin = workspace.admins_id.includes(req.user.id) || project.admins_id.includes(req.user.id);

	let query;
	let values;

	if (isAdmin) {
		query = `SELECT * FROM fs_tasker_tasks WHERE project_id = $1`;
		values = [id];
	} else {
		query = `SELECT * FROM fs_tasker_tasks WHERE project_id = $1 AND (owners_id @> ARRAY[$2::int] OR private = false)`;
		values = [id, req.user.id];
	}

	const tasksResult = await db.query(query, values);
	const tasks = tasksResult.rows;

	res.status(200).json(tasks);
}

export async function createProject(req, res) {
	let { title, description, tag, isPrivate, members, workspace_id } = req.body;

	const workspaceResult = await db.query("SELECT * FROM fs_tasker_workspaces WHERE id = $1 AND admins_id @> ARRAY[$2::int]", [workspace_id, req.user.id]);
	const workspace = workspaceResult.rows[0];

	if (!workspace) return res.status(403).json({ message: "Não foi possível criar um projeto nesse workspace" });

	if (!title.trim() || !description.trim() || !tag.trim()) return res.status(403).json({ message: "Preencha todos os campos!" });

	const trueMembers = members.filter((member) => workspace.users_id.includes(Number(member))).map((m) => Number(m));

	if (isPrivate) {
		members = [...new Set([...workspace.admins_id, ...trueMembers])];
	} else {
		members = [];
		isPrivate = false;
	}

	const projectResult = await db.query("INSERT INTO fs_tasker_projects (title, description, tag, creator_id, users_id, workspace_id, private, admins_id) VALUES($1,$2,$3,$4,$5,$6,$7, '{}') RETURNING *", [title.trim(), description.trim(), tag.trim(), req.user.id, members, workspace.id, isPrivate]);
	const project = projectResult.rows[0];

	if (isPrivate) {
		for (const member of members) {
			io.to(`user-${member}`).emit("add-project", project);
		}
	} else {
		io.to(`workspace-${workspace_id}`).emit("add-project", project);
	}

	return res.status(201).json(project);
}

export async function deleteProject(req, res) {
	const { id } = req.params;

	const projectResult = await db.query("SELECT * FROM fs_tasker_projects WHERE id = $1", [id]);
	const project = projectResult.rows[0];

	if (!project) return res.status(403).json({ message: "Não foi possível concluir a ação de deletar" });

	const workspaceResult = await db.query("SELECT * FROM fs_tasker_workspaces WHERE id = $1 AND admins_id @> ARRAY[$2::int]", [project.workspace_id, req.user.id]);
	const workspace = workspaceResult.rows[0];

	if (!workspace) return res.status(403).json({ message: "Não foi possível concluir a ação de deletar" });

	if (!workspace.admins_id.includes(req.user.id)) return res.status(403).json({ message: "Não foi possível concluir a ação de deletar" });

	const deletedProjectResult = await db.query("DELETE FROM fs_tasker_projects WHERE id = $1 RETURNING *", [project.id]);
	const deletedProject = deletedProjectResult.rows[0];

	io.to(`workspace-${deletedProject.workspace_id}`).to(`project-${deletedProject.id}`).emit("delete-project", deletedProject);

	return res.status(200).json(deletedProject);
}

export async function updateProject(req, res) {
	const { id } = req.params;
	let { title, description, tag, private: isPrivate } = req.body;

	const projectResult = await db.query("SELECT * FROM fs_tasker_projects WHERE id = $1 ", [id]);
	const project = projectResult.rows[0];

	if (!project) return res.status(403).json({ message: "Não foi possível atualizar esse projeto" });

	const workspaceResult = await db.query("SELECT * FROM fs_tasker_workspaces WHERE id = $1", [project.workspace_id]);
	const workspace = workspaceResult.rows[0];

	if (!workspace) return res.status(403).json({ message: "Não foi possível atualizar esse projeto" });

	const canEdit = workspace.admins_id.includes(req.user.id);

	if (!canEdit) return res.status(403).json({ message: "Não foi possível atualizar esse projeto" });

	title = title.trim() || project.title;
	description = description.trim() || project.description;
	tag = tag.trim() || project.tag;

	const updatedProjectResult = await db.query("UPDATE fs_tasker_projects SET title = $1, description = $2, tag = $3, private = $4 WHERE id = $5 RETURNING *", [title, description, tag, isPrivate, id]);
	const updatedProject = updatedProjectResult.rows[0];

	io.to(`workspace-${project.workspace_id}`).to(`project-${project.id}`).emit("update-project", updatedProject);

	res.status(201).json(updatedProject);
}

export async function addMember(req, res) {
	const { id } = req.params;

	const projectResult = await db.query("SELECT * FROM fs_tasker_projects WHERE id = $1", [id]);
	const project = projectResult.rows[0];

	if (!project) return res.status(403).json({ message: "Não foi possível alterar esse projeto" });

	const userId = req.body.userId;
	const username = req.body.username.trim();

	const userResult = await db.query(`SELECT id FROM fs_tasker_users WHERE id = $1 AND username = $2`, [userId, username]);
	const user = userResult.rows[0];

	if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
	if (user.id === req.user.id) return res.status(403).json({ message: "Você não pode enviar convite para esse usuário" });

	if (project.users_id.includes(user.id)) return res.status(403).json({ message: "Usuário já está no projeto" });

	const workspaceResult = await db.query("SELECT * FROM fs_tasker_workspaces WHERE users_id @> ARRAY[$1::int] AND id = $2", [userId, project.workspace_id]);
	const workspace = workspaceResult.rows[0];

	if (!workspace) return res.status(403).json({ message: "O usuário precisa fazer parte do Workspace" });

	if (!project.private) return res.status(403).json({ message: "Este projeto é público para todos os membros do workspace" });

	const canAddMember = [...new Set([...workspace.admins_id, ...project.admins_id])].includes(req.user.id);

	if (!canAddMember) return res.status(403).json({ message: "Você não tem permissão para adicionar novos membros ao projeto" });
	const updatedProjectResult = await db.query("UPDATE fs_tasker_projects SET users_id = ARRAY_APPEND(users_id, $1) WHERE id = $2 RETURNING *", [userId, id]);
	const updatedProject = updatedProjectResult.rows[0];

	const projectNotificationResult = await db.query("INSERT INTO fs_tasker_notifications (sender_id, receiver_id, project_id, seen, status, sender_username, sender_name, title, table_name) VALUES($1,$2,$3, false, 'join', $4, $5, $6, 'project') RETURNING *", [req.user.id, userId, project.id, req.user.username, req.user.name, project.title]);
	const projectNotification = projectNotificationResult.rows[0];

	io.to(`user-${user.id}`).emit("update-project", updatedProject);
	io.to(`user-${user.id}`).emit("notificate", projectNotification);

	return res.status(201).json(updatedProject);
}

export async function deleteMember(req, res) {
	const { id } = req.params;

	const projectResult = await db.query("SELECT * FROM fs_tasker_projects WHERE id = $1", [id]);
	const project = projectResult.rows[0];

	if (!project) return res.status(403).json({ message: "Não foi possível alterar esse projeto" });

	if (!project.private) return res.status(403).json({ message: "Esse workspace é público para todos os membros do workspace" });

	const userId = req.body.userId;
	const username = req.body.username.trim();

	const userResult = await db.query(`SELECT id FROM fs_tasker_users WHERE id = $1 AND username = $2`, [userId, username]);
	const user = userResult.rows[0];

	if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
	if (user.id === req.user.id) return res.status(403).json({ message: "Você não pode enviar convite para esse usuário" });

	if (!project.users_id.includes(user.id)) return res.status(403).json({ message: "Usuário não faz parte do projeto" });

	const workspaceResult = await db.query("SELECT * FROM fs_tasker_workspaces WHERE users_id @> ARRAY[$1::int] AND id = $2", [userId, project.workspace_id]);
	const workspace = workspaceResult.rows[0];

	if (!workspace) return res.status(403).json({ message: "O usuário precisa fazer parte do Workspace" });

	const canDeleteMember = [...new Set([...workspace.admins_id, ...project.admins_id])].includes(req.user.id);

	if (!canDeleteMember) return res.status(403).json({ message: "Você não tem permissão para deletar membros" });

	const updatedProjectResult = await db.query("UPDATE fs_tasker_projects SET users_id = ARRAY_REMOVE(users_id, $1), admins_id = ARRAY_REMOVE(admins_id, $1) WHERE id = $2 RETURNING *", [userId, id]);
	const updatedProject = updatedProjectResult.rows[0];

	const projectNotificationResult = await db.query("INSERT INTO fs_tasker_notifications (sender_id, receiver_id, project_id, seen, status, sender_username, sender_name, title, table_name) VALUES($1,$2,$3, false, 'leave', $4, $5, $6, 'project') RETURNING *", [req.user.id, userId, project.id, req.user.username, req.user.name, project.title]);
	const projectNotification = projectNotificationResult.rows[0];

	io.to(`user-${user.id}`).emit("update-project", updatedProject);
	io.to(`user-${user.id}`).emit("notificate", projectNotification);

	return res.status(201).json(updatedProject);
}

export async function isCreator(req, res) {
	const id = Number(req.params.id);

	const projectResult = await db.query("SELECT * FROM fs_tasker_projects WHERE id = $1", [id]);
	const project = projectResult.rows[0];

	if (!project) return res.status(403).json({ message: "Não é possível editar esse projeto" });

	const workspaceResult = await db.query("SELECT * FROM fs_tasker_workspaces WHERE id = $1", [project.workspace_id]);
	const workspace = workspaceResult.rows[0];

	if (project.creator_id !== req.user.id && workspace.creator_id !== req.user.id && !workspace.admins_id.includes(req.user.id)) return res.status(403).json({ message: "Não é possível editar esse projeto" });

	return res.status(200).json(project);
}

export async function updateAdmin(req, res) {
	const id = Number(req.params.id);

	const projectResult = await db.query("SELECT * FROM fs_tasker_projects WHERE id = $1", [id]);
	const project = projectResult.rows[0];

	const workspaceResult = await db.query("SELECT * FROM fs_tasker_workspaces WHERE id = $1 AND admins_id @> ARRAY[$2::INT]", [project.workspace_id, req.user.id]);
	const workspace = workspaceResult.rows[0];

	if (project.creator_id !== req.user.id && !workspace.admins_id.includes(req.user.id)) return res.status(403).json({ message: "Não foi possível editar esse projeto" });

	const userId = Number(req.body.userId);

	if (project.private && !project.users_id.includes(userId)) return res.status(403).json({ message: "Esse usuário não faz parte do projeto" });

	if (!project.private && !workspace.users_id.includes(userId)) return res.status(403).json({ message: "Esse usuário não faz parte do projeto" });

	const updatedProjectResult = await db.query(
		`
		UPDATE fs_tasker_projects SET admins_id = 
		CASE
		WHEN ARRAY_POSITION(admins_id, $1) IS NOT NULL
		THEN ARRAY_REMOVE(admins_id, $1)
		ELSE ARRAY_APPEND(admins_id, $1)
		END
		WHERE id = $2 RETURNING *`,
		[userId, id],
	);
	const updatedProject = updatedProjectResult.rows[0];

	return res.status(201).json(updatedProject);
}

export async function sendMessage(req, res) {
	const id = Number(req.params.id);
	const { receiver_id, text } = req.body;

	const projectResult = await db.query("SELECT * FROM fs_tasker_projects WHERE id = $1", [id]);
	const project = projectResult.rows[0];

	if (!project) return res.status(404).json({ message: "Projeto não encontrado" });

	let canSend = false;
	let canReceive = false;

	if (project.private) {
		canSend = project.users_id.includes(req.user.id);
		canReceive = project.users_id.includes(receiver_id);
	} else {
		const workspaceResult = await db.query("SELECT * FROM fs_tasker_workspaces WHERE id = $1", [project.workspace_id]);
		const workspace = workspaceResult.rows[0];

		canSend = workspace.users_id.includes(req.user.id);
		canReceive = workspace.users_id.includes(receiver_id);
	}

	if (canSend && canReceive) {
		const newMessageResult = await db.query("INSERT INTO fs_tasker_messages (sender_id, sender_name, receiver_id, project_id, text, project_title) VALUES ($1,$2,$3,$4,$5, $6) RETURNING *", [req.user.id, req.user.name, receiver_id, project.id, text, project.title]);
		const message = newMessageResult.rows[0];

		const projectNotificationResult = await db.query("INSERT INTO fs_tasker_notifications (sender_id, receiver_id, project_id, seen, status, sender_username, sender_name, title, table_name) VALUES($1,$2,$3, false, '', $4, $5, $6, 'message') RETURNING *", [req.user.id, receiver_id, project.id, req.user.username, req.user.name, project.title]);
		const projectNotification = projectNotificationResult.rows[0];

		io.to(`user-${receiver_id}`).emit("notificate", projectNotification);

		const ids = [receiver_id, req.user.id].sort((a, b) => a - b);

		console.log(`message-room/${ids[0]}_${ids[1]}?projectId=${project.id}`);
		// io.to(`message-room/${ids[0]}_${ids[1]}?projectId=${project.id}`).emit("new-message", message);

		io.to(`user-${receiver_id}`).to(`user-${req.user.id}`).emit("new-message", message);

		return res.status(201).json(message);
	}

	return res.status(403).json({ message: "Não foi possível enviar esta mensagem" });
}

export async function getMessages(req, res) {
	const id = Number(req.params.id);
	const memberId = Number(req.query.memberId);
	const before = req.query.before;

	const projectResult = await db.query("SELECT * FROM fs_tasker_projects WHERE id = $1", [id]);
	const project = projectResult.rows[0];

	console.log({ before });

	if (before != "null") {
		const isValidDate = !isNaN(Date.parse(before));

		if (!isValidDate) {
			// Interrompe a requisição e retorna erro 400 (Bad Request)
			return res.status(400).json({ error: "O parâmetro 'before' deve ser uma data válida." });
		}
	}

	if (!project) return res.status(404).json({ message: "Projeto não encontrado" });

	let canGetMessages = false;

	if (project.private) {
		canGetMessages = project.users_id.includes(req.user.id);
	} else {
		const workspaceResult = await db.query("SELECT * FROM fs_tasker_workspaces WHERE id = $1", [project.workspace_id]);
		const workspace = workspaceResult.rows[0];

		canGetMessages = workspace.users_id.includes(req.user.id);
	}

	if (canGetMessages) {
		let messagesResult;
		if (before == "null") {
			messagesResult = await db.query("SELECT * FROM fs_tasker_messages WHERE project_id = $1 AND (sender_id = $2 OR receiver_id = $2) AND (sender_id = $3 OR receiver_id = $3) ORDER BY sent_at DESC LIMIT 50", [project.id, req.user.id, memberId]);
		} else {
			console.log({ before });
			messagesResult = await db.query("SELECT * FROM fs_tasker_messages WHERE project_id = $1 AND (sender_id = $2 OR receiver_id = $2) AND (sender_id = $3 OR receiver_id = $3) AND sent_at < $4::timestamptz::timestamp ORDER BY sent_at DESC LIMIT 20", [project.id, req.user.id, memberId, before]);
		}

		const messages = messagesResult.rows;
		messages.sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));

		const deletedNotificationsResult = await db.query("DELETE FROM fs_tasker_notifications WHERE project_id = $1 AND (sender_id = $2 OR receiver_id = $2) AND (sender_id = $3 OR receiver_id = $3) RETURNING *", [project.id, req.user.id, memberId]);
		const deletedNotifications = deletedNotificationsResult.rows;

		const notifications = deletedNotifications?.map((n) => n?.id) || [];
		io.to(`user-${req.user.id}`).emit("notificate", { status: "delete-messages", notifications });

		return res.status(200).json(messages);
	}

	return res.status(403).json({ message: "Não foi possível carregar as mensagens" });
}

export async function getGlobalMessages(req, res) {
	const projectId = Number(req.params.projectId);
	const before = req.query.before;

	if (before != "null") {
		const isValidDate = !isNaN(Date.parse(before));

		if (!isValidDate) {
			// Interrompe a requisição e retorna erro 400 (Bad Request)
			return res.status(400).json({ error: "O parâmetro 'before' deve ser uma data válida." });
		}
	}

	const projectResult = await db.query("SELECT * FROM fs_tasker_projects WHERE id = $1", [projectId]);
	const project = projectResult.rows[0];

	if (!project) return res.status(404).json({ message: "Projeto não encontrado" });

	if (project.private) {
		if (!project.users_id.includes(req.user.id)) return res.status(403).json({ message: "Você não faz parte desse projeto" });
	} else {
		const workspaceResult = await db.query("SELECT * FROM fs_tasker_workspaces WHERE id = $1", [project.workspace_id]);
		const workspace = workspaceResult.rows[0];

		if (!workspace) return res.status(500).json({ message: "Algo deu errado. Tente novamente..." });

		if (!workspace.users_id.includes(req.user.id)) return res.status(403).json({ message: "Você não faz parte desse projeto" });
	}

	let messagesResults;
	if (before == "null") {
		messagesResults = await db.query("SELECT * FROM fs_tasker_messages WHERE project_id = $1 AND receiver_id IS NULL ORDER BY sent_at DESC LIMIT 50", [project.id]);
	} else {
		console.log(before);

		messagesResults = await db.query("SELECT * FROM fs_tasker_messages WHERE project_id = $1 AND receiver_id IS NULL AND sent_at < $2::timestamptz::timestamp ORDER BY sent_at DESC LIMIT 20", [project.id, before]);
	}

	const messages = messagesResults.rows.sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));

	res.status(200).json(messages);
}

export async function sendGlobalMessage(req, res) {
	const projectId = Number(req.params.projectId);

	const projectResult = await db.query("SELECT * FROM fs_tasker_projects WHERE id = $1", [projectId]);
	const project = projectResult.rows[0];

	if (!project) return res.status(404).json({ message: "Projeto não encontrado" });

	let users_id = [];

	if (project.private) {
		if (!project.users_id.includes(req.user.id)) return res.status(403).json({ message: "Você não faz parte desse projeto" });

		users_id = [...project.users_id];
	} else {
		const workspaceResult = await db.query("SELECT * FROM fs_tasker_workspaces WHERE id = $1", [project.workspace_id]);
		const workspace = workspaceResult.rows[0];

		if (!workspace) return res.status(500).json({ message: "Algo deu errado. Tente novamente..." });

		if (!workspace.users_id.includes(req.user.id)) return res.status(403).json({ message: "Você não faz parte desse projeto" });

		users_id = [...workspace.users_id];
	}

	const text = req.body.text;

	const messageResults = await db.query("INSERT INTO fs_tasker_messages (sender_id, sender_name, project_id, project_title, text) VALUES($1, $2, $3, $4, $5) RETURNING *", [req.user.id, req.user.name, project.id, project.title, text]);

	const message = messageResults.rows[0];

	for (const user_id of users_id) {
		io.to(`user-${user_id}`).emit("new-global-message", message);
	}

	res.status(201).json(message);
}

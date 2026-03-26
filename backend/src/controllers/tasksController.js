import path from "path";
import db from "../config/db.js";
import { io } from "../../server.js";
import fs from "fs";

export function getTasks(req, res) {
	const { id } = req.params;

	console.log(id);

	res.json("Chegou");
}

export async function createTask(req, res) {
	let { title, description, tag, status, duedate, prio, owners_id, isPrivate } = req.body;
	const project_id = Number(req.query.project_id);

	const hasEmptyFields = [title, description, tag, status, duedate, prio, isPrivate].some((value) => {
		if (typeof value === "string") return !value.trim().length;

		if (Array.isArray(value)) return value.length === 0;
	});

	if (hasEmptyFields) return res.status(403).json({ message: "Preencha todos os campos!" });

	duedate = new Date(duedate + "T00:00:00").toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});

	const projectResult = await db.query("SELECT * FROM fs_tasker_projects WHERE id = $1", [project_id]);
	const project = projectResult.rows[0];

	if (!project) return res.status(404).json({ message: "Não foi possível adicionar a tarefa a esse projeto" });

	const workspaceResult = await db.query("SELECT * FROM fs_tasker_workspaces WHERE id = $1", [project.workspace_id]);
	const workspace = workspaceResult.rows[0];

	if (project.private && !project.users_id.includes(req.user.id) && !workspace.admins_id.includes(req.user.id)) return res.status(403).json({ message: "Você não faz parte desse projeto" });

	if (!project.private && !project.users_id.includes(req.user.id) && !workspace.users_id.includes(req.user.id)) return res.status(403).json({ message: "Você não faz parte desse projeto ou workspace" });

	const creatorIsAdmin = project.admins_id.includes(req.user.id) || workspace.admins_id.includes(req.user.id);
	let trueOwners;
	if (project.private) {
		trueOwners = owners_id?.filter((owner) => project.users_id.includes(owner))?.length ? owners_id.filter((owner) => project.users_id.includes(owner)) : [req.user.id];
	} else {
		trueOwners = owners_id?.filter((owner) => workspace.users_id.includes(owner)) || [req.user.id];
	}

	if (!creatorIsAdmin) {
		trueOwners = [req.user.id];
	}

	const taskResult = await db.query("INSERT INTO fs_tasker_tasks(title, description, tag, status, duedate, prio, creator_id, owners_id, project_id, private) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *", [title, description, tag, status, duedate, prio, req.user.id, trueOwners, project_id, isPrivate]);
	const task = taskResult.rows[0];

	if (task.private) {
		const users_id = [...new Set([...task.owners_id, ...project.admins_id, ...workspace.admins_id])];

		for (const user_id of users_id) {
			io.to(`user-${user_id}`).emit("add-task", task);
		}
	} else {
		io.to(`project-${project_id}`).emit("add-task", task);
	}

	res.status(201).json(task);
}

export async function deleteTask(req, res) {
	const { id } = req.params;

	const taskResult = await db.query("SELECT * FROM fs_tasker_tasks WHERE id = $1", [id]);
	const task = taskResult.rows[0];

	if (!task) return res.status(404).json({ message: "Tarefa não encontrada" });

	const projectResult = await db.query("SELECT * FROM fs_tasker_projects WHERE id = $1", [task.project_id]);
	const project = projectResult.rows[0];

	if (!project) return res.status(500).json({ message: "Erro ao deletar esta tarefa" });

	const workspaceResult = await db.query("SELECT * FROM fs_tasker_workspaces WHERE id = $1", [project.workspace_id]);
	const workspace = workspaceResult.rows[0];

	if (!workspace) return res.status(500).json({ message: "Erro ao deletar esta tarefa" });

	const canDelete = workspace.admins_id.includes(req.user.id) || project.admins_id.includes(req.user.id) || task.creator_id === req.user.id;

	if (!canDelete) return res.status(403).json({ message: "Você não pode deletar esta tarefa" });

	const deletedTaskResult = await db.query(
		`
        DELETE FROM fs_tasker_tasks
        WHERE id = $1
        RETURNING *;
    `,
		[id],
	);
	const deletedTask = deletedTaskResult.rows[0];

	if (!deletedTask) return res.status(403).json({ message: "Não foi possível deletar essa tarefa" });

	io.to(`project-${deletedTask.project_id}`).emit("delete-task", deletedTask);

	return res.status(201).json(deletedTask);
}

export async function attachFiles(req, res) {
	const { files } = req;

	if (!files.length) return res.status(500).json({ message: "Nenhum arquivo foi recebido" });

	const filesPaths = files.map((file) => file.path);

	if (!filesPaths || !filesPaths.length) return res.status(500).json({ message: "Nenhum arquivo foi recebido" });

	const taskId = Number(req.params.id);

	const taskResult = await db.query("UPDATE fs_tasker_tasks SET files = ARRAY_CAT(files, $1::text[]) WHERE id = $2 RETURNING *", [filesPaths, taskId]);
	const task = taskResult.rows[0];

	if (!task) return res.status(500).json({ message: "Algo deu errado..." });

	let usersTask;

	if (task.private) {
		usersTask = [...new Set([...req.workspace.admins_id, ...req.project.admins_id, ...task.owners_id, task.creator_id])];
	} else {
		if (req.project.private) {
			usersTask = [...req.project.users_id];
		} else {
			usersTask = [...req.workspace.users_id];
		}
	}

	for (const user_id of usersTask) {
		io.to(`user-${user_id}`).emit("update-task", task);
	}

	return res.status(201).json(task);
}

export async function downloadFile(req, res) {
	const filename = req.params.filename;

	const filePath = path.join("files", filename);

	return res.download(filePath);
}

export async function updateStatus(req, res) {
	const status = req.query.status;

	const id = Number(req.params.id);

	if (!["todo", "doing", "done"].includes(status)) return res.status(403).json({ message: "Status inválido" });

	const taskResult = await db.query("SELECT * FROM fs_tasker_tasks WHERE id = $1", [id]);
	const task = taskResult.rows[0];

	if (!task) return res.status(404).json({ message: "Tarefa não encotrada" });

	const projectResult = await db.query("SELECT * FROM fs_tasker_projects WHERE id = $1", [task.project_id]);
	const project = projectResult.rows[0];

	if (!project) return res.status(500).json({ message: "Não foi possível atualizar essa tarefa" });

	const workspaceResult = await db.query("SELECT * FROM fs_tasker_workspaces WHERE id = $1", [project.workspace_id]);
	const workspace = workspaceResult.rows[0];

	if (!workspace) return res.status(500).json({ message: "Não foi possível atualizar essa tarefa" });

	const usersCanEdit = [...new Set([...workspace.admins_id, ...project.admins_id, ...task.owners_id, task.creator_id])];

	if (!usersCanEdit.includes(req.user.id)) return res.status(403).json({ message: "Você não pode alterar essa tarefa" });

	const updatedTaskResult = await db.query("UPDATE fs_tasker_tasks SET status = $1 WHERE id = $2 RETURNING *", [status, id]);
	const updatedTask = updatedTaskResult.rows[0];

	if (task.private) {
		for (const user of usersCanEdit) {
			io.to(`user-${user}`).emit("update-task", updatedTask);
		}
	} else {
		io.to(`project-${project.id}`).emit("update-task", updatedTask);
	}

	return res.status(201).json(updatedTask);
}

export async function updateTask(req, res) {
	const taskId = Number(req.params.id);

	const taskResult = await db.query("SELECT * FROM fs_tasker_tasks WHERE id = $1", [taskId]);
	const task = taskResult.rows[0];

	if (!task) return res.status(404).json({ message: "Tarefa não encontrada" });

	const projectResult = await db.query("SELECT * FROM fs_tasker_projects WHERE id = $1", [task.project_id]);
	const project = projectResult.rows[0];

	if (!project) return res.status(500).json({ message: "Não foi possível editar essa tarefa" });

	const workspaceResult = await db.query("SELECT * FROM fs_tasker_workspaces WHERE id = $1", [project.workspace_id]);
	const workspace = workspaceResult.rows[0];

	if (!workspace) return res.status(500).json({ message: "Não foi possível editar essa tarefa" });

	const canEdit = workspace.admins_id.includes(req.user.id) || project.admins_id.includes(req.user.id) || task.creator_id === req.user.id;

	if (!canEdit) return res.status(500).json({ message: "Não foi possível editar essa tarefa" });

	let { title, description, tag, duedate, status, prio, owners_id, private: isPrivate } = req.body;
	isPrivate = isPrivate == "true" ? true : false;
	const duedateArr = duedate?.split("-");

	if (!duedateArr || !duedateArr.length) return res.status(500).json({ message: "Não foi possível editar essa tarefa" });

	duedate = `${duedateArr[2]}/${duedateArr[1]}/${duedateArr[0]}`;

	if ([title, description, tag, status, prio].some((el) => !el.trim().length)) return res.status(500).json({ message: "Não foi possível editar essa tarefa" });

	if (!owners_id || !owners_id?.length) return res.status(500).json({ message: "Não foi possível editar essa tarefa" });

	const updatedTaskResult = await db.query(
		`
		UPDATE fs_tasker_tasks 
		SET 
		title = $1,
		description = $2, 
		tag = $3, 
		duedate = $4, 
		status = $5, 
		prio = $6, 
		owners_id = $7::int[],
		private = $8
		WHERE id = $9 RETURNING *
		`,
		[title, description, tag, duedate, status, prio, owners_id, isPrivate, taskId],
	);
	const updatedTask = updatedTaskResult.rows[0];

	const users_task = [...new Set([...workspace.admins_id, ...project.admins_id, ...updatedTask.owners_id, updatedTask.creator_id])];

	if (updatedTask.private) {
		const arentUsers = [...new Set([...task.owners_id, ...project.users_id, ...workspace.users_id])].filter((owner_id) => !users_task.includes(owner_id));

		console.log(arentUsers);

		if (arentUsers.length) {
			for (const user_id of arentUsers) {
				io.to(`user-${user_id}`).emit("leave-task", updatedTask);
			}
		}

		for (const user_id of users_task) {
			io.to(`user-${user_id}`).emit("update-task", updatedTask);
		}
	} else {
		console.log("É pública");
		io.to(`project-${updatedTask.project_id}`).emit("update-task", updatedTask);
	}

	return res.status(201).json(updatedTask);
}

export async function detachFiles(req, res) {
	const { filename } = req.body;

	if (req.task.files.includes(filename)) {
		const updatedTaskResult = await db.query("UPDATE fs_tasker_tasks SET files = ARRAY_REMOVE(files, $1) WHERE id = $2 RETURNING *", [filename, req.task.id]);
		const updatedTask = updatedTaskResult.rows[0];

		fs.unlinkSync(filename);

		let usersTask;

		if (updatedTask.private) {
			usersTask = [...new Set([...req.workspace.admins_id, ...req.project.admins_id, ...updatedTask.owners_id, updatedTask.creator_id])];
		} else {
			if (req.project.private) {
				usersTask = [...req.project.users_id];
			} else {
				usersTask = [...req.workspace.users_id];
			}
		}

		for (const user_id of usersTask) {
			io.to(`user-${user_id}`).emit("update-task", updatedTask);
		}

		return res.status(201).json(updatedTask);
	} else {
		console.log("ERRO");
		return res.status(500).json({ message: "Esse arquivo não pertence a essa tarefa" });
	}
}

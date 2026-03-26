import multer from "multer";
import db from "./db.js";

const filesStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "files");
	},
	filename: (req, file, cb) => {
		const originalNameUtf8 = Buffer.from(file.originalname, "latin1").toString("utf8");
		console.log(originalNameUtf8);

		const finalName = new Date().getTime() + "-" + Math.round(Math.random() * 1e9) + "_" + originalNameUtf8;
		console.log(finalName);
		cb(null, finalName);
	},
});

const upload = multer({
	storage: filesStorage,
}).array("files");

export default upload;

export async function canAttachFile(req, res, next) {
	const taskId = Number(req.params.id);

	const taskResult = await db.query("SELECT * FROM fs_tasker_tasks WHERE id = $1", [taskId]);
	const task = taskResult.rows[0];

	if (!task) return res.status(404).json({ message: "Tarefa não encontrada" });

	const projectResult = await db.query("SELECT * FROM fs_tasker_projects WHERE id = $1", [task.project_id]);
	const project = projectResult.rows[0];

	if (!project) return res.status(404).json({ message: "Tarefa não encontrada" });

	const workspaceResult = await db.query("SELECT * FROM fs_tasker_workspaces WHERE id = $1", [project.workspace_id]);
	const workspace = workspaceResult.rows[0];

	if (!workspace) return res.status(404).json({ message: "Tarefa não encontrada" });

	const canAttachArr = [...new Set([...workspace.admins_id, ...project.admins_id, task.creator_id, ...task.owners_id])];

	const canAttach = canAttachArr.includes(req.user.id);

	if (!canAttach) return res.status(401).json({ message: "Você não tem permissão para editar essa tarefa" });

	req.task = task;
	req.project = project;
	req.workspace = workspace;

	next();
}

export async function canDownloadFile(req, res, next) {
	const taskId = Number(req.params.id);

	const taskResult = await db.query("SELECT * FROM fs_tasker_tasks WHERE id = $1", [taskId]);
	const task = taskResult.rows[0];

	if (!task) return res.status(404).json({ message: "Tarefa não encontrada" });

	const projectResult = await db.query("SELECT * FROM fs_tasker_projects WHERE id = $1", [task.project_id]);
	const project = projectResult.rows[0];

	if (!project) return res.status(404).json({ message: "Tarefa não encontrada" });

	const workspaceResult = await db.query("SELECT * FROM fs_tasker_workspaces WHERE id = $1", [project.workspace_id]);
	const workspace = workspaceResult.rows[0];

	if (!workspace) return res.status(404).json({ message: "Tarefa não encontrada" });

	let canDowloadArr;

	if (task.private) {
		canDowloadArr = [...new Set([...workspace.admins_id, ...project.admins_id, task.creator_id, ...task.owners_id])];
	} else {
		if (project.private) {
			canDowloadArr = [...new Set([...project.users_id])];
		} else {
			canDowloadArr = [...new Set([...workspace.users_id])];
		}
	}

	const canDownload = canDowloadArr.includes(req.user.id);

	if (!canDownload) return res.status(401).json({ message: "Você não tem permissão para editar essa tarefa" });

	req.task = task;
	req.project = project;
	req.workspace = workspace;

	next();
}

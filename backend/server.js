import express from "express";
import cookieParser from "cookie-parser";
import env from "dotenv";
import cors from "cors";
import http from "http";
import jwt from "jsonwebtoken";

env.config();

import userRoutes from "./src/routes/userRoutes.js";
import tasksRoutes from "./src/routes/tasksRoutes.js";
import workspacesRoutes from "./src/routes/workspacesRoutes.js";
import projectsRoutes from "./src/routes/projectsRoutes.js";
import db from "./src/config/db.js";
import { Server } from "socket.io";
import { auth } from "./src/config/auth.js";
import path from "path";

const __dirname = path.resolve();

const app = express();
const port = 3000;

const server = http.createServer(app);

export const io = new Server(server, {
	cors: {
		origin: "http://localhost:5173",
		credentials: true,
	},
});

io.engine.use(cookieParser());

io.use((socket, next) => {
	const token = socket.request.cookies?.token;

	if (!token) {
		return next(new Error("Acesso negado: Nenhum cookie encontrado"));
	}

	jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
		if (err) {
			return next(new Error("Acesso negado: Token inválido ou expirado"));
		}

		const timeUntilExpiry = decoded.exp * 1000 - Date.now();

		if (timeUntilExpiry <= 0) {
			return next(new Error("Acesso negado: Token expirado"));
		}

		socket.user = decoded;

		socket.expirationTimer = setTimeout(() => {
			socket.disconnect(true);
		}, timeUntilExpiry);

		return next();
	});
});

io.on("connection", (socket) => {
	const { user } = socket;

	socket.join(`user-${user.id}`);
	console.log(`🟢 User ID conectado e na sala: ${user.id} (Socket: ${socket.id})`);

	socket.on("join-workspace", async (id) => {
		const { rowCount } = await db.query("SELECT 1 FROM fs_tasker_workspaces WHERE id = $1 AND users_id @> ARRAY[$2::int]", [id, user.id]);

		if (rowCount) {
			socket.join(`workspace-${id}`);
			console.log(`workspace-${id}`);
		}
	});
	socket.on("leave-workspace", (id) => {
		console.log("Deixou workspace");
		socket.leave(`workspace-${id}`);
	});

	socket.on("join-project", async (id) => {
		const projectResult = await db.query("SELECT * FROM fs_tasker_projects WHERE id = $1", [id]);
		const project = projectResult.rows[0];

		if (!project) return;

		if (project.private) {
			if (project.users_id.includes(user.id)) {
				socket.join(`project-${id}`);
				console.log(`project-${id}`);
			}
		} else {
			const workspaceResult = await db.query("SELECT * FROM fs_tasker_workspaces WHERE id = $1", [project.workspace_id]);
			const workspace = workspaceResult.rows[0];

			if (workspace.users_id.includes(user.id)) {
				socket.join(`project-${id}`);
				console.log(`project-${id}`);
			}
		}
	});
	socket.on("leave-project", (id) => {
		socket.leave(`project-${id}`);
	});

	socket.on("disconnect", () => {
		console.log("🔴 Usuário desconectado:", socket.id);
		clearTimeout(socket.expirationTimer);
	});
});

app.use(express.json());
app.use(cookieParser());
if (process.env.NODE_ENV !== "production") {
	app.use(
		cors({
			origin: "http://localhost:5173",
			credentials: true,
		}),
	);
}

app.use("/user", userRoutes);
app.use("/tasks", auth, tasksRoutes);
app.use("/workspaces", auth, workspacesRoutes);
app.use("/projects", auth, projectsRoutes);

if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "../frontend/dist")));
	app.use((req, res) => {
		res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
	});
}

db.connect().then(() => {
	server.listen(port, () => {
		console.log(`API running on port ${port}`);
	});
});

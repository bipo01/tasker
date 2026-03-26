import { useState } from "react";
import { EyeOff, Paperclip } from "lucide-react";
import api from "../../utils/api.js";
import { getWorkspaces, queryClient } from "../../utils/http.js";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Maximize2 } from "lucide-react";

function Task({ task, setAttechedFiles }) {
	const { id, projectId } = useParams();
	const [selectedFiles, setSelectedFiles] = useState([]);

	const navigate = useNavigate();

	function handleFileChange(e) {
		const files = Array.from(e.target.files);
		setSelectedFiles(files);
	}

	function seeAttachedFiles() {
		setAttechedFiles(task);
	}

	async function handleAttachFile(e) {
		e.preventDefault();
		const formData = new FormData(e.target);

		const res = await api.post(`/tasks/${task.id}/attach`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});

		if (res.status !== 201) return alert("Não foi possível anexar este arquivo");

		const updatedTask = res.data;

		queryClient.setQueryData(["project", projectId], (oldData) => {
			if (!oldData) return oldData;

			return [...oldData.filter((t) => t.id !== updatedTask.id), updatedTask].sort((a, b) => {
				const aDuedateArr = a.duedate.split("/");
				const bDuedateArr = b.duedate.split("/");

				const aDuedate = new Date(`${aDuedateArr[2]}-${aDuedateArr[1]}-${aDuedateArr[0]}T00:00:00`);
				const bDuedate = new Date(`${bDuedateArr[2]}-${bDuedateArr[1]}-${bDuedateArr[0]}T00:00:00`);

				return aDuedate - bDuedate;
			});
		});

		setSelectedFiles([]);
		e.target.reset();
	}

	const { data, isPending } = useQuery({
		queryKey: ["workspaces", id],
		queryFn: ({ signal }) => getWorkspaces({ signal, id }),
	});

	if (!task) return null;
	if (isPending) return <div className="task-loading">Carregando...</div>;

	const { users } = data;

	let { title, tag, prio, status, description, duedate, creator_id, owners_id, created_at, files } = task;

	const isPrivate = task.private;
	const creator = users.find((user) => user.id === creator_id);
	const admins = users.filter((user) => owners_id.includes(user.id));
	const priority = prio === "low" ? "Baixa" : prio === "med" ? "Média" : "Alta";

	const dateObj = new Date(created_at);
	const formattedDate = dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
	const formattedTime = dateObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
	const formattedData = `${formattedDate}, ${formattedTime}`;

	const statusMap = {
		todo: { label: "A começar", classKey: "todo" },
		doing: { label: "Em andamento", classKey: "doing" },
		done: { label: "Concluída", classKey: "done" },
	};
	const currentStatus = statusMap[status] || statusMap.todo;

	async function handleDelete() {
		if (!window.confirm("Certeza que gostaria de deletar essa tarefa?")) return;

		const res = await api.delete(`/tasks/${task.id}`);
		if (res.status !== 201) return alert("Algo deu errado");
	}

	async function handleUpdate(status) {
		const res = await api.put(`/tasks/${task.id}/status?status=${status}`);

		if (res.status !== 201) return alert("Algo deu errado");
	}

	return (
		<article className={`task-card card-${currentStatus.classKey}`}>
			<header className="task-header">
				{/* NOVO: Botões estilo macOS */}
				<div className="task-mac-actions">
					{task.canEdit && (
						<div className="mac-buttons-group">
							{/* Deletar aparece em todos */}
							{task.canDelete && <button onClick={handleDelete} className="mac-btn action-delete" title="Deletar Tarefa"></button>}

							{/* Botões para TO DO */}

							{status === "todo" && (
								<>
									<button onClick={() => handleUpdate("doing")} className="mac-btn action-start" title="Começar Tarefa (Mover para Em Andamento)"></button>
									<button onClick={() => handleUpdate("done")} className="mac-btn action-complete" title="Concluir Direto"></button>
								</>
							)}

							{/* Botões para DOING */}
							{status === "doing" && (
								<>
									<button onClick={() => handleUpdate("todo")} className="mac-btn action-stop" title="Parar (Voltar para A Começar)"></button>
									<button onClick={() => handleUpdate("done")} className="mac-btn action-complete" title="Concluir Tarefa"></button>
								</>
							)}

							{/* Botões para DONE */}
							{status === "done" && (
								<>
									<button onClick={() => handleUpdate("todo")} className="mac-btn action-stop" title="Parar (Voltar para Em Andamento)"></button>
									<button onClick={() => handleUpdate("doing")} className="mac-btn action-start" title="Recomeçar (Voltar para A Começar)"></button>
								</>
							)}
						</div>
					)}

					{isPrivate && (
						<span className="task-private" title="Privado">
							<EyeOff className="ico" size={16} />
						</span>
					)}
				</div>

				<div className="task-title-row">
					<h3 className="task-title">{title}</h3>
				</div>

				<div className="task-badges">
					<span className="task-badge status-badge">
						<span className={`status-dot dot-${currentStatus.classKey}`}></span>
						{currentStatus.label}
					</span>
					<span className="task-badge tag-badge">{tag}</span>
					<span className={`task-badge prio-badge prio-${prio.toLowerCase()}`}>{priority}</span>
				</div>
			</header>

			{description && <p className="task-desc">{description}</p>}

			<div className="task-meta-info">
				<div className="meta-block">
					<span className="meta-title">Data Limite</span>
					<span className="meta-data">{duedate}</span>
				</div>
				<div className="meta-block">
					<span className="meta-title">Criado em</span>
					<span className="meta-data">{formattedData}</span>
				</div>
			</div>

			<footer className="task-footer">
				<div className="task-people">
					<div className="task-creator">
						Criador:{" "}
						<strong>
							{creator?.name.split(" ")[0]} {creator?.name.split(" ").at(-1)}
						</strong>
					</div>

					{admins.length > 0 && (
						<div className="task-admins">
							{admins.map((adm) => {
								const nameArr = adm.name.split(" ");
								const inits = nameArr.length > 1 ? `${nameArr[0][0]}${nameArr[nameArr.length - 1][0]}`.toUpperCase() : `${nameArr[0][0]}`.toUpperCase();

								return (
									<div title={adm.name} key={adm.id} className="admin-avatar">
										{inits}
									</div>
								);
							})}
						</div>
					)}
				</div>

				{selectedFiles.length > 0 && (
					<div className="task-selected-files">
						{selectedFiles.map((file, index) => (
							<span key={index} className="selected-file-chip">
								<Paperclip size={12} className="ico-small" />
								{file.name}
							</span>
						))}
					</div>
				)}

				{files?.length ? (
					<p onClick={seeAttachedFiles} className="files-length">
						{files?.length} arquivo{files?.length > 1 ? "s" : ""} anexado{files?.length > 1 ? "s" : ""}
					</p>
				) : (
					""
				)}

				{task.canEdit && (
					<form onSubmit={handleAttachFile} className="task-attach-form">
						<div className="attach-input-wrapper">
							<input type="file" name="files" id={`file-${task.id}`} multiple className="file-input-hidden" onChange={handleFileChange} />
							<label htmlFor={`file-${task.id}`} className="file-input-label">
								<Paperclip className="ico" size={16} /> Anexar
							</label>
						</div>

						<button type="submit" className="btn-attach" disabled={selectedFiles.length === 0}>
							Enviar
						</button>
					</form>
				)}

				<div className="task-footer-actions">
					<button onClick={() => navigate(`${task.id}`)} className="btn-open-task" title="Ver detalhes da tarefa">
						<Maximize2 size={14} />
						Abrir Detalhes
					</button>
				</div>
			</footer>
		</article>
	);
}

export default Task;

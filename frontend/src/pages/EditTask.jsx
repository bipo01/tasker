import { Link, useOutletContext, useParams } from "react-router-dom";

import { useState } from "react";
import api from "../utils/api";
import { queryClient } from "../utils/http";
import { DeleteIcon } from "lucide-react";
function EditTask() {
	const { projectId, taskId } = useParams();
	const { task, workspace } = useOutletContext();
	const [taskInputs, setTaskInputs] = useState({
		title: task.title,
		description: task.description,
		tag: task.tag,
		duedate: task.duedate,
		status: task.status,
		prio: task.prio,
		owners_id: task.owners_id,
		private: task.private,
	});
	const [isDifferent, setIsDifferent] = useState(false);

	const project = workspace.projects.find((p) => p.id === Number(projectId));

	const users_project = project.private ? [...workspace.users.filter((u) => project.users_id.includes(u.id) || workspace.admins_id.includes(u.id))] : workspace.users;

	function handleChange(e) {
		const key = e.target.name;
		const value = e.target.value;

		if (!value.trim()) return;

		setTaskInputs((prev) => {
			let updatedInputs;

			if (key === "duedate") {
				const date = new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

				updatedInputs = { ...prev, [key]: date };
			} else if (key === "owners_id") {
				const numValue = Number(value);
				const isRemoving = prev.owners_id.includes(numValue);

				if (isRemoving && prev.owners_id.length === 1) {
					updatedInputs = { ...prev };
				} else {
					const arr = isRemoving ? prev.owners_id.filter((owner) => owner !== numValue) : [...prev.owners_id, numValue];

					updatedInputs = { ...prev, [key]: arr };
				}
			} else {
				if (key === "private") {
					const boolean = value == "true" ? true : false;

					updatedInputs = { ...prev, [key]: boolean };
				} else {
					updatedInputs = { ...prev, [key]: value };
				}
			}

			const entries = Object.entries(updatedInputs);

			if (
				entries.some(([key]) => {
					if (key === "owners_id") {
						const taskArr = task[key]?.sort((a, b) => a - b).join("");
						const stateArr = updatedInputs[key]?.sort((a, b) => a - b).join("");

						if (taskArr !== stateArr) {
							return true;
						} else {
							return false;
						}
					}
					const isDifferent = updatedInputs[key] !== task[key];

					return isDifferent;
				})
			) {
				setIsDifferent(true);
			} else {
				setIsDifferent(false);
			}
			return updatedInputs;
		});
	}

	async function detachFile(filename) {
		console.log(filename, task.id);
		const res = await api.put(`/tasks/detach/${task.id}`, { filename });

		if (res.status !== 201) return alert("Erro ao remover arquivo");

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
	}

	async function handleSubmit(e) {
		e.preventDefault();
		const formData = new FormData(e.target);
		const body = Object.fromEntries(formData.entries());
		const owners_id = formData.getAll("owners_id").map((owner) => Number(owner));
		body.owners_id = owners_id;

		const res = await api.put(`/tasks/${taskId}`, body);

		if (res.status !== 201) return alert("Erro ao editar esta tarefa");

		const updatedTask = res.data;

		queryClient.setQueryData(["project", projectId], (oldData) => {
			if (!oldData) return oldData;

			const tasks = [...oldData.filter((t) => t.id !== updatedTask.id), updatedTask];

			return tasks;
		});

		setIsDifferent(false);
	}

	const duedateArr = task.duedate.split("/");
	const formattedDuedate = `${duedateArr[2]}-${duedateArr[1]}-${duedateArr[0]}`;

	return (
		<div className="edit-task-overlay">
			<div className="edit-task-container">
				<div className="edit-task-header">
					<h2>Editar Tarefa</h2>
					<p>Atualize os dados da tarefa abaixo.</p>
				</div>

				<form onSubmit={handleSubmit} className="edit-task-form">
					<div className="input-group">
						<label>Título</label>
						<input onChange={handleChange} name="title" defaultValue={taskInputs.title} placeholder="Ex: Desenvolver nova feature..." required />
					</div>

					<div className="input-group">
						<label>Descrição</label>
						<textarea onChange={handleChange} rows={9} name="description" defaultValue={taskInputs.description} placeholder="Adicione os detalhes da tarefa..." />
					</div>

					<div className="row-group">
						<div className="input-group">
							<label>Tag</label>
							<input onChange={handleChange} name="tag" defaultValue={taskInputs.tag} placeholder="Ex: frontend" />
						</div>
						<div className="input-group">
							<label>Prazo</label>
							<input onChange={handleChange} type="date" name="duedate" defaultValue={formattedDuedate} />
						</div>
					</div>

					<div className="row-group">
						<div className="input-group">
							<label>Status</label>
							<select onChange={handleChange} name="status" defaultValue={taskInputs.status}>
								<option value="todo">A começar</option>
								<option value="doing">Em andamento</option>
								<option value="done">Concluída</option>
							</select>
						</div>
						<div className="input-group">
							<label>Prioridade</label>
							<select onChange={handleChange} name="prio" defaultValue={taskInputs.prio}>
								<option value="low">Baixa</option>
								<option value="med">Média</option>
								<option value="high">Alta</option>
							</select>
						</div>
					</div>

					<div className="input-group owners-task">
						<label>Responsáveis</label>
						<div className="members-list">
							{users_project.map((u) => (
								<label key={u.id} className="member-item">
									<input onChange={handleChange} type="checkbox" name="owners_id" value={u.id} checked={taskInputs.owners_id.includes(u.id)} />
									<div className="member-info">
										<span className="member-name">{u.name}</span>
										<span className="member-username">@{u.username}</span>
									</div>
								</label>
							))}
						</div>
					</div>

					<div className="input-group">
						<label>Visibilidade</label>
						<div className="visibility-options">
							<label className={`radio-card ${!taskInputs.private ? "selected" : ""}`}>
								<input onChange={handleChange} type="radio" name="private" value={false} checked={!taskInputs.private} />
								Pública
							</label>
							<label className={`radio-card ${taskInputs.private ? "selected" : ""}`}>
								<input onChange={handleChange} type="radio" name="private" value={true} checked={taskInputs.private} />
								Privada
							</label>
						</div>
					</div>

					{task?.files?.length ? (
						<div className="input-group">
							<label>Arquivos anexados</label>

							<div className="edit-files">
								<ul>
									{task?.files?.map((file) => {
										const fileName = file.split("_").slice(1).join("_");

										return (
											<li key={file}>
												<span>{fileName}</span>
												<span onClick={() => detachFile(file)} title="Remover arquivo" className="delete-file-icon">
													<DeleteIcon color="red" />
												</span>
											</li>
										);
									})}
								</ul>
							</div>
						</div>
					) : (
						""
					)}

					<div className="edit-task-actions">
						<Link to=".." className="btn-cancel">
							Fechar
						</Link>
						{isDifferent && (
							<button type="submit" className="btn-submit">
								Salvar Alterações
							</button>
						)}
					</div>
				</form>
			</div>
		</div>
	);
}

export default EditTask;

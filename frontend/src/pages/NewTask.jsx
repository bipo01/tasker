import { useQuery } from "@tanstack/react-query";
import { Form, Link, useParams, useRouteLoaderData } from "react-router-dom";
import { getWorkspaces } from "../utils/http";
import { useState } from "react";

function NewTask() {
	const { id, projectId } = useParams();
	const user = useRouteLoaderData("auth-required");
	const { data: workspace, isPending } = useQuery({
		queryKey: ["workspaces", id],
		queryFn: ({ signal }) => getWorkspaces({ signal, id }),
	});

	const [isPrivate, setIsPrivate] = useState(false);

	if (isPending) return <p>Carregando...</p>;

	const project = workspace.projects.find((p) => p.id === Number(projectId));
	const users_project = project.private ? [...workspace.users.filter((u) => project.users_id.includes(u.id) || workspace.admins_id.includes(u.id))] : workspace.users;

	return (
		<div className="new-task-overlay">
			<div className="new-task-container">
				<div className="new-task-header">
					<h2>Nova Task</h2>
					<p>Preencha os dados abaixo para criar uma nova tarefa no projeto.</p>
				</div>

				<Form method="post" className="new-task-form">
					<div className="input-group">
						<label>Título</label>
						<input name="title" placeholder="Ex: Desenvolver nova feature..." />
					</div>

					<div className="input-group">
						<label>Descrição</label>
						<textarea rows={9} name="description" placeholder="Adicione os detalhes da tarefa..." />
					</div>

					<div className="row-group">
						<div className="input-group">
							<label>Tag</label>
							<input name="tag" placeholder="Ex: frontend" />
						</div>
						<div className="input-group">
							<label>Prazo</label>
							<input type="date" name="duedate" />
						</div>
					</div>

					<div className="row-group">
						<div className="input-group">
							<label>Status</label>
							<select name="status">
								<option value="todo">A começar</option>
								<option value="doing">Em andamento</option>
								<option value="done">Concluída</option>
							</select>
						</div>
						<div className="input-group">
							<label>Prioridade</label>
							<select name="prio">
								<option value="low">Baixa</option>
								<option value="med">Média</option>
								<option value="high">Alta</option>
							</select>
						</div>
					</div>

					{(workspace.admins_id.includes(user.id) || project.admins_id.includes(user.id)) && (
						<div className="input-group owners-task">
							<label>Responsáveis</label>
							<div className="members-list">
								{users_project.map((user) => (
									<label key={user.id} className="member-item">
										<input type="checkbox" name="owners_id" value={user.id} />
										<div className="member-info">
											<span className="member-name">{user.name}</span>
											<span className="member-username">{user.username}</span>
										</div>
									</label>
								))}
							</div>
						</div>
					)}

					<div className="input-group">
						<label>Visibilidade</label>
						<div className="visibility-options">
							<label className={`radio-card ${!isPrivate ? "selected" : ""}`}>
								<input onChange={() => setIsPrivate(false)} type="radio" name="isPrivate" value={false} checked={!isPrivate} />
								Pública
							</label>
							<label className={`radio-card ${isPrivate ? "selected" : ""}`}>
								<input onChange={() => setIsPrivate(true)} type="radio" name="isPrivate" value={true} checked={isPrivate} />
								Privada
							</label>
						</div>
					</div>

					<div className="new-task-actions">
						<Link to=".." className="btn-cancel">
							Cancelar
						</Link>
						<button type="submit" className="btn-submit">
							Adicionar Task
						</button>
					</div>
				</Form>
			</div>
		</div>
	);
}

export default NewTask;

import { Link, Outlet, useOutletContext, useParams, useRouteLoaderData } from "react-router-dom";
import { Calendar, Tag, AlertCircle, Lock, Globe, Users, X } from "lucide-react";
import fileDownload from "js-file-download";
import api from "../utils/api";
import { File } from "lucide-react";
import { Download } from "lucide-react";

function Task() {
	const { taskId } = useParams();
	const { workspace, project, tasks } = useOutletContext();

	const user = useRouteLoaderData("auth-required");

	const task = tasks.find((t) => t.id === Number(taskId));

	const owners = workspace.users.filter((u) => task.owners_id.includes(u.id));
	const creator = workspace.users.find((u) => u.id === task.creator_id);

	task.owners = owners;
	task.creator = creator;

	const duedateArr = task.duedate.split("/");
	const finalDuedate = new Date(`${duedateArr[2]}-${duedateArr[1]}-${duedateArr[0]}T00:00:00`).toLocaleDateString("pt-BR");

	const canEdit = workspace.admins_id.includes(user.id) || project.admins_id.includes(user.id) || task.creator_id === user.id;

	// Tradutores visuais de status e prioridade
	const statusMap = {
		todo: { label: "A começar", class: "status-todo" },
		doing: { label: "Em andamento", class: "status-doing" },
		done: { label: "Concluída", class: "status-done" },
	};

	const prioMap = {
		low: { label: "Baixa", class: "prio-low" },
		med: { label: "Média", class: "prio-med" },
		high: { label: "Alta", class: "prio-high" },
	};

	return (
		<div className="task-view-overlay">
			<div className="task-container">
				{/* Cabeçalho */}
				<header className="task-detail-header">
					<div className="task-header-badges">
						<span className={`task-badge ${statusMap[task.status]?.class}`}>
							<span className="badge-dot" />
							{statusMap[task.status]?.label}
						</span>
						<span className={`task-badge ${prioMap[task.prio]?.class}`}>{prioMap[task.prio]?.label}</span>
						<div className="task-visibility">
							{task.private ? (
								<>
									<Lock size={14} /> Privada
								</>
							) : (
								<>
									<Globe size={14} /> Pública
								</>
							)}
						</div>
					</div>

					<Link to=".." className="btn-close-modal">
						<X size={20} />
					</Link>
				</header>

				{/* Conteúdo Principal */}
				<main className="task-detail-body">
					<h1 className="task-title-large">{task.title}</h1>

					<div className="task-description-box">
						<h3>Descrição</h3>
						<p>{task.description}</p>
					</div>

					{/* Grid de Metadados (Tag, Data, etc) */}
					<div className="task-meta-grid">
						<div className="meta-card">
							<Tag size={16} className="meta-icon" />
							<div className="meta-info">
								<span>Tag</span>
								<strong>{task.tag || "Sem tag"}</strong>
							</div>
						</div>

						<div className="meta-card">
							<Calendar size={16} className="meta-icon" />
							<div className="meta-info">
								<span>Prazo</span>
								<strong>{task.duedate ? finalDuedate : "Sem prazo"}</strong>
							</div>
						</div>
					</div>

					{/* Responsáveis */}
					<div className="task-owners-section">
						<div className="owners-header">
							<Users size={16} />
							<h3>Responsáveis</h3>
						</div>

						{task.owners && task.owners.length > 0 ? (
							<div className="owners-list">
								{task.owners.map((owner) => (
									<div key={owner.id} className="owner-card">
										<div className="owner-avatar">{owner.name.charAt(0).toUpperCase()}</div>
										<div className="owner-details">
											<span className="owner-name">{owner.name}</span>
											<span className="owner-user">@{owner.username}</span>
										</div>
									</div>
								))}
							</div>
						) : (
							<p className="no-owners">Ninguém atribuído a esta tarefa ainda.</p>
						)}
					</div>

					<div className="task-owners-section">
						<div className="owners-header">
							<Users size={16} />
							<h3>Criador</h3>
						</div>

						<div className="owners-list">
							<div className="owner-card">
								<div className="owner-avatar">{creator.name.charAt(0).toUpperCase()}</div>
								<div className="owner-details">
									<span className="owner-name">{creator.name}</span>
									<span className="owner-user">@{creator.username}</span>
								</div>
							</div>
						</div>
					</div>

					{task?.files?.length ? (
						<div className="details-attached-files">
							<div className="owners-header">
								<File size={16} />
								<h3>Arquivos anexados</h3>
							</div>
							<ul>
								{task.files.map((file, i) => {
									const fileName = file.split("_").slice(1).join("_");

									const fileNameParam = file.split("files/").slice(1).join("");

									return (
										<li key={i}>
											<span>{fileName}</span>

											<Download
												className="details-download-button"
												onClick={async () => {
													const res = await api.get(`/tasks/${task.id}/download/${fileNameParam}`, { responseType: "blob" });

													if (res.status !== 200) return alert("Erro ao baixar esse arquivo");

													fileDownload(res.data, fileName);
												}}
												key={file}
											/>
										</li>
									);
								})}
							</ul>
						</div>
					) : (
						""
					)}
				</main>

				{/* Rodapé / Ações */}
				<footer className="task-detail-footer">
					{canEdit && (
						<Link to="edit" className="btn-footer-primary">
							Editar Tarefa
						</Link>
					)}
				</footer>
			</div>

			<Outlet context={{ task, workspace }} />
		</div>
	);
}

export default Task;

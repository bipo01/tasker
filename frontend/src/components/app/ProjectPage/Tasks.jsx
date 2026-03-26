import { Link, Outlet, useOutletContext, useParams, useRouteLoaderData } from "react-router-dom";
import Task from "../Task";
import { Plus } from "lucide-react";
import { useState } from "react";
import api from "../../../utils/api";
import fileDownload from "js-file-download";
import { useEffect } from "react";
import { socket } from "../../../utils/socket";
import { queryClient } from "../../../utils/http";

function Tasks() {
	const user = useRouteLoaderData("auth-required");
	const { workspace, project, tasks, filters } = useOutletContext();

	const [attachedFiles, setAttechedFiles] = useState();

	const { projectId } = useParams();

	const [statusView, setStatusView] = useState(["todo", "doing", "done"]);

	function handleStatus(status) {
		setStatusView((prev) => {
			if (prev.includes(status)) {
				return prev.filter((s) => s !== status);
			} else {
				return [...prev, status];
			}
		});
	}

	const getBoardTitle = () => {
		if (statusView.length === 3) return "Todas as Tarefas";
		if (statusView.length === 0) return "Nenhum status selecionado";
		if (statusView.length === 1) {
			if (statusView.includes("todo")) return "A Começar";
			if (statusView.includes("doing")) return "Em Andamento";
			if (statusView.includes("done")) return "Concluídas";
		}
		return "Tarefas Filtradas";
	};

	const displayedTasks =
		tasks
			.sort((a, b) => {
				const aDuedateArr = a.duedate.split("/");
				const bDuedateArr = b.duedate.split("/");

				const aDuedate = new Date(`${aDuedateArr[2]}-${aDuedateArr[1]}-${aDuedateArr[0]}T00:00:00`);
				const bDuedate = new Date(`${bDuedateArr[2]}-${bDuedateArr[1]}-${bDuedateArr[0]}T00:00:00`);

				return aDuedate - bDuedate;
			})
			?.filter((task) => statusView.includes(task.status))
			?.filter((task) => {
				const title = task.title.trim().toLowerCase();
				const description = task.description.trim().toLowerCase();
				const duedate = task.duedate.trim().toLowerCase();
				const created_atArr = task.created_at.split("-");
				const created_at = `${created_atArr.at(2).split("T").at(0)}/${created_atArr.at(1)}/${created_atArr.at(0)}`;
				const { owners_id, creator_id, prio, tag } = task;

				const searchBar = filters.searchBar.trim().toLowerCase();
				const { selectByPrio, selectByTag, selectByOwner, selectByCreator } = filters;

				let filter1,
					filter2,
					filter3,
					filter4,
					filter5 = true;

				if (!owners_id.includes(Number(selectByOwner)) && selectByOwner !== "") {
					filter1 = false;
				}

				if (creator_id !== Number(selectByCreator) && selectByCreator !== "") {
					filter2 = false;
				}

				if (selectByPrio !== prio && selectByPrio !== "") {
					filter3 = false;
				}

				if (selectByTag.trim().toLowerCase() !== tag.trim().toLowerCase() && selectByTag !== "") {
					console.log(tag);
					console.log(selectByTag);
					filter4 = false;
				}

				if (![title, description, duedate, created_at].some((el) => el.includes(searchBar))) {
					filter5 = false;
				}

				if ([filter1, filter2, filter3, filter4, filter5].some((filter) => filter === false)) {
					return false;
				} else {
					return true;
				}
			}) || [];

	useEffect(() => {
		socket.on("add-task", (task) => {
			queryClient.setQueryData(["project", projectId], (oldData) => {
				if (!oldData) return oldData;
				return [...oldData, task];
			});
		});

		socket.on("delete-task", (task) => {
			queryClient.setQueryData(["project", projectId], (oldData) => {
				if (!oldData) return oldData;
				return oldData.filter((t) => t.id !== task.id);
			});
		});

		socket.on("update-task", (task) => {
			queryClient.setQueryData(["project", projectId], (oldData) => {
				if (!oldData) return oldData;

				return [...oldData.filter((t) => t.id !== task.id), task].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
			});
		});
		socket.on("leave-task", (task) => {
			queryClient.setQueryData(["project", projectId], (oldData) => {
				if (!oldData) return oldData;

				return [...oldData.filter((t) => t.id !== task.id)].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
			});
		});

		return () => {
			socket.off("add-task");
			socket.off("delete-task");
			socket.off("update-task");
			socket.off("leave-task");
		};
	}, [projectId]);

	return (
		<>
			<header className="project-topbar">
				<div className="project-title">
					<div className="breadcrumbs">
						<span>{workspace?.title}</span>
						<span className="crumb-sep">/</span>
						<span className="crumb-strong">{project?.title}</span>
					</div>
				</div>

				<div className="project-topbar-actions">
					{/* NOVO: Grupo de botões estilo Segmented Control */}
					<div className="status-toggles">
						<button className={`status-toggle-btn ${statusView.includes("todo") ? "active" : ""}`} onClick={() => handleStatus("todo")}>
							<span className="board-dot board-dot--todo" /> A começar
						</button>
						<button className={`status-toggle-btn ${statusView.includes("doing") ? "active" : ""}`} onClick={() => handleStatus("doing")}>
							<span className="board-dot board-dot--doing" /> Em andamento
						</button>
						<button className={`status-toggle-btn ${statusView.includes("done") ? "active" : ""}`} onClick={() => handleStatus("done")}>
							<span className="board-dot board-dot--done" /> Concluídas
						</button>
					</div>

					<div className="action-buttons">
						<Link to="new" className="topbar-btn topbar-btn--primary">
							<Plus className="ico" aria-hidden="true" /> Nova Task
						</Link>
					</div>
				</div>
			</header>

			<section className="board-large">
				<header className="board-header">
					<div className="board-status-info">
						<h2>{getBoardTitle()}</h2>
						<span className="task-counter">{displayedTasks.length}</span>
					</div>
				</header>

				<div className="tasks-grid">
					{displayedTasks.map((task) => {
						const canEdit = task.owners_id.includes(user.id) || workspace.admins_id.includes(user.id) || project.admins_id.includes(user.id) || task.creator_id === user.id;
						const canDelete = workspace.admins_id.includes(user.id) || project.admins_id.includes(user.id) || task.creator_id === user.id;

						return <Task setAttechedFiles={setAttechedFiles} key={task.id} task={{ ...task, canEdit, canDelete }} />;
					})}

					{displayedTasks.length === 0 && (
						<div className="empty-board">
							<p>Nenhuma tarefa corresponde aos filtros selecionados.</p>
						</div>
					)}
				</div>
			</section>
			<Outlet context={{ workspace, project, tasks }} />

			{attachedFiles?.files?.length && (
				<div className="attached-files-container">
					<ul>
						{attachedFiles.files.map((file) => {
							const fileName = file.split("_").slice(1).join("_");
							const fileNameParam = file.split("files/").slice(1).join("");

							return (
								<li
									onClick={async () => {
										const res = await api.get(`/tasks/${attachedFiles.id}/download/${fileNameParam}`, { responseType: "blob" });

										if (res.status !== 200) return alert("Erro ao baixar o arquivo");

										fileDownload(res.data, fileName);
									}}
									key={file}>
									{fileName}
								</li>
							);
						})}
					</ul>
					<button onClick={() => setAttechedFiles(null)} className="close-attached-files">
						Fechar
					</button>
				</div>
			)}
		</>
	);
}

export default Tasks;

import { Outlet, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getTasks, getWorkspaces } from "../utils/http.js";
import Sidebar from "../components/app/ProjectPage/Sidebar.jsx";

import { useState } from "react";
import { useEffect } from "react";
import { socket } from "../utils/socket.js";

function ProjectPage() {
	const { projectId: id, id: workspaceId } = useParams();

	const [filters, setFilters] = useState({
		searchBar: "",
		selectByPrio: "",
		selectByTag: "",
		selectByCreator: "",
		selectByOwner: "",
	});

	const { data: tasks, isPending } = useQuery({
		queryKey: ["project", id],
		queryFn: ({ signal }) => getTasks({ signal, id }),
	});

	const { data: workspace } = useQuery({
		queryKey: ["workspaces", workspaceId],
		queryFn: ({ signal }) => getWorkspaces({ signal, id: workspaceId }),
	});

	useEffect(() => {
		socket.emit("join-project", id);

		return () => {
			socket.emit("leave-project", id);
		};
	}, [id]);

	if (isPending) return <div className="loading-state">Carregando tarefas...</div>;

	if (workspace === undefined) return <div className="loading-state">Carregando tarefas...</div>;

	const project = workspace.projects.find((p) => p.id == id);

	const users_project = project.users_id.length ? workspace.users.filter((user) => project.users_id.includes(user.id)) : workspace.users;

	return (
		<div className="projects-container">
			<Sidebar tasks={tasks} filters={filters} setFilters={setFilters} users_project={users_project} />
			<main className="project-main">
				<Outlet context={{ workspace, project, tasks, filters, users_project }} />
			</main>
		</div>
	);
}

export default ProjectPage;

import Project from "../components/app/Project";
import ButtonBack from "../components/ui/ButtonBack";

import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, useParams, useRouteLoaderData } from "react-router-dom";
import { getWorkspaces } from "../utils/http";
import { useEffect } from "react";
import { socket } from "../utils/socket";

function Workspace() {
	const { id } = useParams();
	const user = useRouteLoaderData("auth-required");

	useEffect(() => {
		socket.emit("join-workspace", id);

		return () => {
			socket.emit("leave-workspace", id);
		};
	}, [id, user.id]);

	const { data: workspace, isPending } = useQuery({
		queryKey: ["workspaces", id],
		queryFn: ({ signal }) => getWorkspaces({ signal, id }),
	});

	if (isPending) return <p className="loading-text">Carregando projetos...</p>;

	return (
		<>
			<div className="workspace-container">
				<ButtonBack goTo=".." path={{ relative: "path" }} />

				{/* AGRUPAMENTO VISUAL PARA O CABEÇALHO (Textos de um lado, Botão do outro) */}
				<div className="workspace-header">
					<div className="workspace-info">
						<h2>{workspace.title}</h2>
						<h3>{workspace.description}</h3>
					</div>

					{workspace.admins_id.includes(user.id) && (
						<Link to="projects/new" className="btn-new-project">
							+ Novo Projeto
						</Link>
					)}
				</div>

				{!workspace?.projects?.length && (
					<div className="empty-state">
						<p>Não há nenhum projeto para esse workspace</p>
					</div>
				)}

				{workspace?.projects?.length ? (
					<>
						<div className="projects-container">
							{workspace?.projects.map((project) => {
								return <Project key={project.id} project={project} />;
							})}
						</div>
					</>
				) : (
					""
				)}
			</div>
			<Outlet />
		</>
	);
}

export default Workspace;

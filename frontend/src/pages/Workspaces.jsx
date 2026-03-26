import { Link, Outlet, useNavigate, useRouteLoaderData } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getWorkspaces } from "../utils/http.js";
import { useEffect } from "react";

function Workspaces() {
	const navigate = useNavigate();
	const user = useRouteLoaderData("auth-required");

	useEffect(() => {}, []);

	const { data } = useQuery({
		queryKey: ["workspaces"],
		queryFn: getWorkspaces,
	});

	return (
		<div className="workspaces-container">
			<main className="workspaces-main">
				<header className="workspaces-header">
					<div className="header-content">
						<h1>Workspaces</h1>
						<p>Organize times, projetos e membros com uma visão clara e profissional.</p>
					</div>

					<Link to="new" className="btn-primary">
						+ Novo Workspace
					</Link>
				</header>

				<section aria-label="Lista de workspaces" className="workspaces-grid">
					{data?.map((ws) => {
						return (
							<div onClick={() => navigate(`${ws.id}`)} key={ws.id} className="workspace-card">
								<div className="card-header">
									<h3>{ws.title}</h3>

									{user.id === ws.creator_id && (
										<div className="card-actions">
											<Link onClick={(e) => e.stopPropagation()} to={`${ws.id}/edit`} className="btn-edit-workspace" aria-label="Editar workspace">
												<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
													<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
													<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
												</svg>
											</Link>
											<span className="status-indicator" aria-hidden="true" />
										</div>
									)}
								</div>

								<p className="card-description">{ws.description}</p>
							</div>
						);
					})}
				</section>
			</main>

			<Outlet />
		</div>
	);
}

export default Workspaces;

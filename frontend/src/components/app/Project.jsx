import { Link, useParams, useNavigate, useRouteLoaderData } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getWorkspaces } from "../../utils/http";

function Project({ project }) {
	const { id } = useParams();
	const navigate = useNavigate();

	const user = useRouteLoaderData("auth-required");

	function handleEdit(e) {
		// Impede que o clique no botão acione o <Link> do card
		e.preventDefault();
		e.stopPropagation();

		// Aqui você pode adicionar a lógica para abrir o modal de edição
		// ou navegar para a rota de edição:
		navigate(`projects/${project.id}/edit`);
	}

	const { data: workspace, isPending } = useQuery({
		queryKey: ["workspaces", id],
		queryFn: ({ signal }) => getWorkspaces({ signal, id }),
	});

	if (isPending) return <p>Carregando...</p>;

	return (
		<Link to={`/workspaces/${id}/projects/${project.id}`} className="project-container">
			{/* NOVO: Header do projeto agrupando Título e Ações */}
			<div className="project-header">
				<h2>{project.title}</h2>

				{workspace.admins_id.includes(user.id) && (
					<div className="card-actions">
						<button title="Editar Projeto" onClick={handleEdit} className="btn-edit-project" aria-label="Editar Projeto">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M12 20h9"></path>
								<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
							</svg>
						</button>
					</div>
				)}
			</div>

			<small>{project.tag}</small>
			<p>{project.description}</p>
		</Link>
	);
}

export default Project;

import { useQuery } from "@tanstack/react-query";
import { Form, useNavigate, useParams } from "react-router-dom";
import { getWorkspaces } from "../../utils/http";
import { useState } from "react";

function NewProject() {
	const { id } = useParams();
	const [isPrivate, setIsPrivate] = useState(false);
	const navigate = useNavigate();

	const { data: workspace, isPending } = useQuery({
		queryKey: ["workspaces", id],
		queryFn: ({ signal }) => getWorkspaces({ signal, id }),
	});

	if (isPending) return <p className="new-project-loading">Carregando...</p>;

	const members = workspace.users.filter((user) => workspace.creator_id !== user.id).filter((user) => !workspace.admins_id.includes(user.id));

	return (
		/* Div de fundo (Backdrop) */
		<div className="new-project-overlay">
			{/* Div do Modal */}
			<div className="new-project-modal">
				<div className="new-project-content">
					<div className="new-project-header">
						<h3>Novo Projeto</h3>
						<p>Adicione um projeto ao workspace {workspace?.title ? `"${workspace.title}"` : ""}.</p>
					</div>

					<Form id="new-project-form" method="post" className="new-project-form">
						<div className="input-group">
							<label>Nome do projeto</label>
							<input name="title" placeholder="Ex: Redesign do Dashboard" required />
						</div>

						<div className="input-group">
							<label>Descrição do projeto</label>
							<textarea rows={7} name="description" placeholder="Breve resumo dos objetivos" required />
						</div>

						<div className="input-group">
							<label>Categoria (Tag)</label>
							<input name="tag" placeholder="Ex: FRONTEND, BACKEND" />
						</div>

						{/* Grupo de Visibilidade (Público/Privado) */}
						<div className="input-group">
							<label>Visibilidade</label>
							<div className="visibility-options">
								<label className={`radio-card ${isPrivate === false ? "selected" : ""}`}>
									<input type="radio" name="isPrivate" value="" checked={isPrivate === false} onChange={() => setIsPrivate(false)} />
									Público
								</label>

								<label className={`radio-card ${isPrivate === true ? "selected" : ""}`}>
									<input type="radio" name="isPrivate" value="true" checked={isPrivate === true} onChange={() => setIsPrivate(true)} />
									Privado
								</label>
							</div>
						</div>

						{/* Lista de Membros (Aparece apenas se for Privado) */}
						{isPrivate && (
							<div className="input-group members-group">
								<label>Selecione os membros com acesso</label>
								<div className="members-list">
									{members.map((member) => {
										return (
											<label key={member.id} className="member-item">
												<input type="checkbox" name="members" value={member.id} />
												<div className="member-info">
													<span className="member-name">{member.name}</span>
													<span className="member-username">@{member.username}</span>
												</div>
											</label>
										);
									})}
								</div>
							</div>
						)}
					</Form>

					<div className="new-project-actions">
						{/* Botão solto, sem form, pronto para receber onClick={() => navigate(...)} */}
						<button onClick={() => navigate(`/workspaces/${id}`)} type="button" className="btn-cancel">
							Cancelar
						</button>

						<button type="submit" form="new-project-form" className="btn-submit">
							Adicionar Projeto
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default NewProject;

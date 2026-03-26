import React, { useState } from "react";
import { Form, Link } from "react-router-dom";

function NewWorkspace() {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");

	return (
		<div className="modal-backdrop">
			{/* O dialog assume o papel do container principal do modal */}
			<dialog open className="new-workspace-dialog">
				<header className="dialog-header">
					<h1 className="dialog-title">Novo Workspace</h1>
					<p className="dialog-subtitle">Crie um novo espaço para organizar seus projetos.</p>
				</header>

				<Form method="post" className="dialog-form">
					<div className="form-group">
						<label htmlFor="nw-title">Título do Workspace</label>
						<input name="title" id="nw-title" type="text" className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Tasker Development" autoFocus required />
					</div>

					<div className="form-group">
						<label htmlFor="nw-desc">Descrição</label>
						<textarea name="description" id="nw-desc" className="textarea-field" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Qual o objetivo deste workspace?" rows="4" />
					</div>

					<div className="dialog-actions">
						{/* Link para voltar (fechar o modal) via React Router */}
						<Link to=".." className="btn-secondary">
							Cancelar
						</Link>
						<button type="submit" className="btn-primary">
							Criar Workspace
						</button>
					</div>
				</Form>
			</dialog>
		</div>
	);
}

export default NewWorkspace;

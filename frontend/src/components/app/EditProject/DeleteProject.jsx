import { useNavigate, useParams } from "react-router-dom";
import api from "../../../utils/api";

function DeleteProject({ ref }) {
	const { projectId: id, id: workspaceId } = useParams();
	const navigate = useNavigate();

	async function handleDelete() {
		const res = await api.delete(`/projects/${id}`);
		if (res.status !== 200) {
			alert("Erro ao deletar esse projeto");
			ref.current.close();

			return;
		}

		return navigate(`/workspaces/${workspaceId}`);
	}

	return (
		<dialog ref={ref} className="delete-workspace-dialog" id="deleteModal">
			<div className="delete-dialog-content">
				<h3>Excluir Projeto</h3>
				<h4>Tem certeza que deseja excluir este projeto?</h4>
				<p>Todos os seus dados serão apagados permanentemente. Esta ação não pode ser desfeita.</p>
			</div>

			<div className="delete-dialog-actions">
				<form method="dialog">
					<button type="submit" className="btn-cancel">
						Cancelar
					</button>
				</form>
				{/* Você adicionará sua lógica de exclusão neste botão */}
				<button onClick={handleDelete} type="button" className="btn-danger">
					Sim, excluir projeto
				</button>
			</div>
		</dialog>
	);
}

export default DeleteProject;

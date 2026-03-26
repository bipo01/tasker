import { useNavigate, useParams } from "react-router-dom";
import api from "../../utils/api";

function DeleteWorkspace({ ref }) {
	const { id } = useParams();
	const navigate = useNavigate();

	async function handleDelete() {
		const res = await api.delete(`/workspaces/${id}`);
		if (res.status !== 200) {
			alert("Erro ao deletar esse workspace");
			ref.current.close();

			return;
		}

		return navigate("/workspaces");
	}

	return (
		<dialog ref={ref} className="delete-workspace-dialog" id="deleteModal">
			<div className="delete-dialog-content">
				<h3>Excluir Workspace</h3>
				<h4>Tem certeza que deseja excluir este workspace?</h4>
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
					Sim, excluir workspace
				</button>
			</div>
		</dialog>
	);
}

export default DeleteWorkspace;

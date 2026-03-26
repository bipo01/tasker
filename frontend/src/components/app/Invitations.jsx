import { useOutletContext } from "react-router-dom";
import api from "../../utils/api";
import { queryClient } from "../../utils/http";

function Invitations() {
	const { wsInvitations } = useOutletContext();

	const getInitials = (name) => {
		if (!name) return "?";
		const parts = name.split(" ");
		if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
		return name[0].toUpperCase();
	};

	async function handleInvitation(id, action) {
		const res = await api.post("/workspaces/handle-invitation", { id, action });

		if (res.status !== 200) alert("Algo deu errado");

		queryClient.setQueryData(["notifications"], (oldData) => {
			if (!oldData) return oldData;

			const wsInvitations = oldData.wsInvitations.filter((i) => i.id !== id);

			return { ...oldData, wsInvitations };
		});
	}

	return (
		<div className="invitations-container">
			{/* Cabeçalho seguindo o padrão content-header */}
			<div className="invitations-header">
				<h2 className="invitations-title">Convites para Workspaces</h2>
				<p className="invitations-subtitle">Gerencie seus convites de colaboração pendentes.</p>
			</div>

			{!wsInvitations || wsInvitations.length === 0 ? (
				<div className="invitations-empty">
					<p>Não há novos convites para workspaces no momento.</p>
				</div>
			) : (
				<ul className="invitations-list">
					{wsInvitations.map((invitation) => (
						<li key={invitation.id} className="invitation-card">
							<div className="invitation-info">
								<div className="invitation-avatar">{getInitials(invitation.sender_name)}</div>
								<div className="invitation-text-group">
									<span className="invitation-label">WORKSPACE</span>
									<h3 className="workspace-name">{invitation.workspace_title}</h3>
									<p className="sender-info">
										Convidado por <strong>{invitation.sender_name}</strong> (@{invitation.sender_username})
									</p>
								</div>
							</div>

							<div className="invitation-actions">
								<button onClick={() => handleInvitation(invitation.id, "reject")} className="btn-reject-outline">
									Rejeitar
								</button>
								<button onClick={() => handleInvitation(invitation.id, "accept")} className="btn-accept-outline">
									Aceitar
								</button>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

export default Invitations;

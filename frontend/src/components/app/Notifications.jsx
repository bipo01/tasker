import { useNavigate, useOutletContext } from "react-router-dom";
import { Trash2Icon, Check, Bell } from "lucide-react";
import { deleteNotification, toggleSeen } from "../../utils/notifications";
import api from "../../utils/api";
// import { useContextData } from "../../context/context";

function Notifications() {
	const { notifications } = useOutletContext();
	const navigate = useNavigate();

	// const { dispatch } = useContextData();

	async function navigateToProject(projectId) {
		const res = await api.get(`/projects/${projectId}`);
		if (res.status !== 200) return alert("ERRO");

		const project = res.data;

		// dispatch({ type: "selectLastMember", payload: memberId });
		// dispatch({ type: "selectMember", payload: memberId });

		navigate(`/workspaces/${project.workspace_id}/projects/${project.id}/messages`);
	}

	const renderNotificationItem = (notification) => {
		const date = new Date(notification.created_at);
		const created_at_date = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
		const created_at_time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

		return (
			<li key={notification.id + notification.created_at} className={`notification-item ${notification.seen ? "is-seen" : "is-new"}`}>
				<div className="notification-icon">
					<Bell size={18} />
				</div>

				<div className="notification-content">
					{notification.table_name === "project" && (
						<p className="notification-text">
							Você foi <strong>{notification.status === "join" ? "adicionado ao" : "excluído do"}</strong> projeto <strong className="project-name">{notification.title}</strong> por <span>{notification.sender_name}</span>
						</p>
					)}

					{notification.table_name === "task" && (
						<p className="notification-text">
							Você foi <strong>{notification.status === "join" ? "adicionado a" : "excluído da"}</strong> tarefa <strong className="project-name">{notification.title}</strong> por <span>{notification.sender_name}</span>
						</p>
					)}

					{notification.table_name === "message" && (
						<p className="notification-text">
							Você recebeu uma mensagem de
							<span>
								<strong> {notification.sender_name}</strong> no projeto{" "}
								<strong style={{ cursor: "pointer" }} onClick={() => navigateToProject(notification.project_id, notification.sender_id)} className="project-name">
									{notification.title}
								</strong>
							</span>
						</p>
					)}

					<span className="notification-time">
						{created_at_date} • {created_at_time}
					</span>
				</div>

				<div className="notification-actions">
					{!notification.seen && (
						<button onClick={() => toggleSeen(notification.id)} className="action-btn check" title="Marcar como lida">
							<Check size={18} />
						</button>
					)}
					<button onClick={() => deleteNotification(notification.id)} className="action-btn delete" title="Excluir">
						<Trash2Icon size={18} />
					</button>
				</div>
			</li>
		);
	};

	return (
		<div className="notifications-page">
			<header className="notifications-header">
				<h1>Notificações</h1>
				<p>Fique por dentro das atualizações dos seus projetos</p>
			</header>

			<div className="notifications-grid">
				<section className="notifications-section">
					<div className="section-title">
						<span className="dot badge-new"></span>
						<h3>Não lidas</h3>
					</div>
					<ul className="notifications-list">{notifications.filter((n) => !n.seen).length > 0 ? notifications.filter((n) => !n.seen).map(renderNotificationItem) : <p className="empty-state">Nenhuma notificação nova.</p>}</ul>
				</section>

				<section className="notifications-section">
					<div className="section-title">
						<span className="dot"></span>
						<h3>Anteriores</h3>
					</div>
					<ul className="notifications-list">{notifications.filter((n) => n.seen).length > 0 ? notifications.filter((n) => n.seen).map(renderNotificationItem) : <p className="empty-state">Histórico vazio.</p>}</ul>
				</section>
			</div>
		</div>
	);
}

export default Notifications;

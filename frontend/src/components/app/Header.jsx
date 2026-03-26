import { Link, useNavigate, useParams, useRouteLoaderData } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getNotifications, queryClient } from "../../utils/http";
import { socket } from "../../utils/socket";
import { useEffect } from "react";
import { useContextData } from "../../context/context";
import { deleteNotification } from "../../utils/notifications";

function Header() {
	const { name, email } = useRouteLoaderData("auth-required");
	const { data } = useQuery({
		queryKey: ["notifications"],
		queryFn: getNotifications,
	});

	const { selectedMember } = useContextData();

	const params = useParams();

	const navigate = useNavigate();

	useEffect(() => {
		socket.on("notificate", (notification) => {
			queryClient.setQueryData(["notifications"], (oldData) => {
				if (!oldData) return oldData;

				if (notification.workspace_id) {
					const wsInvitations = [...oldData.wsInvitations, notification];
					return { ...oldData, wsInvitations };
				}

				if (notification.table_name) {
					if (notification.sender_id === selectedMember && notification.project_id === Number(params?.projectId)) {
						deleteNotification(notification.id);
						return;
					}

					const notifications = [...oldData.notifications, notification].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
					return { ...oldData, notifications };
				}

				if (notification.status === "delete-messages") {
					const { notifications } = notification;

					if (!notifications.length) return;

					const filteredNotifications = oldData.notifications.filter((n) => !notifications.includes(n.id));

					return { ...oldData, notifications: filteredNotifications };
				}
			});
		});

		return () => {
			socket.off("notificate");
		};
	}, [selectedMember, params]);

	if (!data) return null;

	const { wsInvitations, notifications } = data;
	const notificationsLength = wsInvitations?.length + notifications.filter((n) => !n.seen)?.length || 0;

	const nameParts = name.trim().split(" ");
	const abrevName = nameParts.length > 1 ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase() : `${nameParts[0][0]}`.toUpperCase();

	return (
		<header className="app-header">
			<div className="user-profile">
				{/* Container criado para facilitar o position: relative no CSS do badge */}
				<div className="avatar-container" onClick={() => navigate("/account")}>
					{/* O aria-hidden indica aos leitores de tela para ignorarem o avatar */}
					<div className="user-avatar" aria-hidden="true">
						{abrevName}
					</div>

					{/* Exibe o número de notificações apenas se for maior que 0 */}
					{notificationsLength > 0 && (
						<span className="notification-badge" aria-label={`${notificationsLength} notificações não lidas`}>
							{notificationsLength > 99 ? "99+" : notificationsLength}
						</span>
					)}
				</div>

				<div className="user-info">
					<strong className="user-name">{name}</strong>
					<span className="user-email">{email}</span>
				</div>
			</div>

			<nav className="header-actions">
				<Link to="/logout" className="btn-logout">
					Sair
				</Link>
			</nav>
		</header>
	);
}

export default Header;

import { NavLink, Outlet } from "react-router-dom";
import ButtonBack from "../components/ui/ButtonBack";

import { useQuery } from "@tanstack/react-query";
import { getNotifications } from "../utils/http";

function Account() {
	const { data, isPending } = useQuery({
		queryKey: ["notifications"],
		queryFn: getNotifications,
	});

	if (isPending) return <p>Carregando...</p>;

	const { wsInvitations, notifications } = data;

	return (
		<>
			<ButtonBack content="Voltar para Workspaces" goTo="/workspaces" />
			<div className="account-layout">
				{/* Sidebar Esquerda */}
				<aside className="account-sidebar">
					<header className="sidebar-header">
						<h1 className="sidebar-title">Minha Conta</h1>
					</header>

					<nav className="sidebar-nav">
						{/* --- Link: Meus Dados --- */}
						<NavLink end to="" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
							<span className="nav-icon">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
									<circle cx="12" cy="7" r="4"></circle>
								</svg>
							</span>
							<span className="nav-text">Meus Dados</span>
						</NavLink>

						{/* --- Link: Mensagens --- */}
						<NavLink to="notifications" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
							<span className="nav-icon">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7"></path>
									<path d="M13.73 21a2 2 0 01-3.46 0"></path>
								</svg>
							</span>
							<span className="nav-text">Notificações</span>
							{notifications.filter((n) => !n.seen).length > 0 && <span className="nav-badge">{notifications.filter((n) => !n.seen).length}</span>}
						</NavLink>

						{/* --- Link: Convites --- */}
						<NavLink to="invitations" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
							<span className="nav-icon">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
									<line x1="12" y1="8" x2="12" y2="16"></line>
									<line x1="8" y1="12" x2="16" y2="12"></line>
								</svg>
							</span>
							<span className="nav-text">Convites</span>
							{wsInvitations.length > 0 && <span className="nav-badge">{wsInvitations.length}</span>}
						</NavLink>

						{/* --- Link: Configurações --- */}
						<NavLink to="settings" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
							<span className="nav-icon">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<circle cx="12" cy="12" r="3"></circle>
									<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
								</svg>
							</span>
							<span className="nav-text">Configurações</span>
						</NavLink>
					</nav>
				</aside>

				{/* Corpo Principal onde as rotas filhas serão injetadas */}
				<main className="account-content">
					<Outlet context={{ wsInvitations, notifications }} />
				</main>
			</div>
		</>
	);
}

export default Account;

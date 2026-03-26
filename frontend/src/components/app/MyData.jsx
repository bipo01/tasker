import { useQuery } from "@tanstack/react-query";
import { getUserData } from "../../utils/http";
import { useRouteLoaderData } from "react-router-dom";

function MyData() {
	const userInfo = useRouteLoaderData("auth-required");

	const { data: userStats, isPending } = useQuery({
		queryKey: ["user-data"],
		queryFn: getUserData,
	});

	if (isPending) return <p>Carregando...</p>;

	return (
		<div className="my-data-container">
			<header className="content-header">
				<h2 className="content-title">Meus Dados</h2>
				<p className="content-subtitle">Visão geral das suas atividades e informações de perfil.</p>
			</header>

			{/* Painel de Estatísticas */}
			<section className="stats-grid">
				<div className="stat-card">
					<span className="stat-value">{userStats.workspaces}</span>
					<span className="stat-label">Workspaces</span>
				</div>
				<div className="stat-card">
					<span className="stat-value">{userStats.projects}</span>
					<span className="stat-label">Projetos</span>
				</div>
				<div className="stat-card">
					<span className="stat-value">{userStats.tasks}</span>
					<span className="stat-label">Tarefas</span>
				</div>
			</section>

			<hr className="divider" />

			{/* Informações Pessoais */}
			<section className="personal-info-section">
				<div className="section-header">
					<h3>Informações Pessoais</h3>
				</div>

				<div className="info-grid">
					<div className="info-group">
						<label>Nome Completo</label>
						<div className="info-field">{userInfo.name}</div>
					</div>

					<div className="info-group">
						<label>Username</label>
						<div className="info-field">@{userInfo.username}</div>
					</div>

					<div className="info-group full-width">
						<label>E-mail</label>
						<div className="info-field">{userInfo.email}</div>
					</div>
				</div>
			</section>
		</div>
	);
}

export default MyData;

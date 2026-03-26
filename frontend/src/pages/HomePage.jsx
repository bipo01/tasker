import { Link } from "react-router-dom";

function HomePage() {
	return (
		<div className="homepage-container">
			{/* --- CABEÇALHO --- */}
			<header className="home-header">
				<div className="logo">
					{/* Pode substituir por um ícone de verdade depois */}
					<span className="logo-icon">✦</span>
					<span className="logo-text">Tasker</span>
				</div>
				<nav className="header-actions">
					<Link to="/login" className="btn-login">
						Entrar
					</Link>
					<Link to="/signup" className="btn-signup">
						Criar nova conta
					</Link>
				</nav>
			</header>

			{/* --- SEÇÃO PRINCIPAL (HERO) --- */}
			<main className="hero-section">
				<div className="hero-badge">Versão 1.0 Disponível</div>

				<h1 className="hero-title">
					Sincronize sua equipe.
					<br />
					Domine seus <span>projetos.</span>
				</h1>

				<p className="hero-subtitle">Muito mais que uma to-do list. Compartilhe workspaces, organize tarefas complexas e tome decisões rápidas no chat global do projeto. Tudo em um único ambiente premium e sem distrações.</p>

				<div className="hero-cta">
					<Link to="/signup" className="btn-primary">
						Começar agora gratuitamente
					</Link>
					<Link to="/workspaces" className="btn-secondary">
						Acessar meus workspaces
					</Link>
				</div>
			</main>

			{/* --- SEÇÃO DE RECURSOS (FEATURES) --- */}
			<section className="features-section">
				<div className="feature-card">
					<div className="feature-icon">📁</div>
					<h3>Workspaces Compartilhados</h3>
					<p>Crie espaços de trabalho isolados. Convide sua equipe, distribua projetos e mantenha tudo centralizado e seguro.</p>
				</div>

				<div className="feature-card">
					<div className="feature-icon">✓</div>
					<h3>Gestão de Tasks</h3>
					<p>To-do lists inteligentes e integradas. Delegue tarefas, defina prazos e acompanhe o progresso de cada etapa em tempo real.</p>
				</div>

				<div className="feature-card">
					<div className="feature-icon">💬</div>
					<h3>Chat & Comunicação</h3>
					<p>Chega de e-mails perdidos. Converse com todos os membros do projeto em um chat global integrado à sua área de trabalho.</p>
				</div>
			</section>
		</div>
	);
}

export default HomePage;

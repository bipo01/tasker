import { useRouteError, useNavigate } from "react-router-dom";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";

function ErrorElement() {
	const error = useRouteError();
	const navigate = useNavigate();

	// Log para você debugar no console enquanto desenvolve
	console.error("Tasker Error Caught:", error);

	// Lida com erros do React Router (404, etc) ou erros lançados manualmente (throw new Error)
	const is404 = error?.status === 404;
	const title = is404 ? "Página não encontrada" : "Sistema indisponível";
	const message = is404 ? "A página ou recurso que você tentou acessar não existe ou foi removido." : error?.data?.message || error?.message || "Ocorreu um erro inesperado na aplicação. Nossa equipe já foi notificada.";

	return (
		<div className="error-container">
			<div className="error-card">
				<div className="error-icon-wrapper">
					<AlertTriangle size={36} strokeWidth={1.5} />
				</div>

				<h1 className="error-title">{title}</h1>

				<p className="error-message">{message}</p>

				{/* Exibe o status code (ex: 404, 500) se ele existir para dar um tom mais técnico/sólido */}
				{error?.status && <span className="error-code">ERR_CODE: {error.status}</span>}

				<div className="error-actions">
					<button className="error-btn-secondary" onClick={() => navigate(-1)}>
						<ArrowLeft size={18} strokeWidth={2} />
						Voltar
					</button>

					<button className="error-btn-primary" onClick={() => navigate("/")}>
						<Home size={18} strokeWidth={2} />
						Ir para Início
					</button>
				</div>
			</div>
		</div>
	);
}

export default ErrorElement;

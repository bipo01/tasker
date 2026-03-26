import { Form, Link, useActionData } from "react-router-dom";

function Login() {
	const actionData = useActionData();

	return (
		<div className="login-container">
			{/* Área da Logo - Pronta para ser extraída como componente depois */}
			<div className="login-header">
				<div className="login-logo">Tasker</div>
				<p className="login-subtitle">Bem-vindo de volta! Por favor, insira seus dados.</p>
			</div>

			<Form method="post" className="login-form">
				<div className="login-input-group">
					<label htmlFor="username" className="login-label">
						Usuário ou Email
					</label>
					<input type="text" id="username" name="username" placeholder="exemplo@email.com" className="login-input" />
				</div>

				<div className="login-input-group">
					<label htmlFor="password" className="login-label">
						Senha
					</label>
					<input type="password" id="password" name="password" placeholder="••••••••" className="login-input" />
				</div>

				<div className="login-form-actions">
					<a href="#recuperar" className="login-forgot-password">
						Esqueceu a senha?
					</a>
				</div>

				<button type="submit" className="login-button">
					Entrar no sistema
				</button>
			</Form>

			{actionData && <div className="login-error">{actionData}</div>}

			<div className="login-footer">
				<span className="login-footer-text">Não possui uma conta?</span>
				<Link to="/signup" className="login-link">
					Criar agora
				</Link>
			</div>
		</div>
	);
}

export default Login;

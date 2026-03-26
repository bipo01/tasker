import { Form, Link, useActionData } from "react-router-dom";
import ButtonBack from "../components/ui/ButtonBack";

function SignUp() {
	const actionData = useActionData();

	return (
		<main className="signup-container">
			<ButtonBack />

			<header className="signup-header">
				<div className="signup-logo">Tasker</div>
				<p className="signup-subtitle">Crie sua conta para começar a organizar tudo com estilo.</p>
			</header>

			<Form method="post" className="signup-form">
				<section className="signup-section">
					<div className="signup-section-title">
						<h2>Dados do perfil</h2>
						<p>Essas informações aparecem no seu workspace.</p>
					</div>

					<div className="signup-grid">
						<div className="signup-field">
							<label htmlFor="name" className="signup-label">
								Nome
							</label>
							<input id="name" name="name" type="text" placeholder="Seu nome completo" className="signup-input" autoComplete="name" />
						</div>

						<div className="signup-field">
							<label htmlFor="username" className="signup-label">
								Usuário
							</label>
							<input id="username" name="username" type="text" placeholder="seu_usuario" className="signup-input" autoComplete="username" />
							<p className="signup-hint">Use letras minúsculas, números e underline.</p>
						</div>

						<div className="signup-field signup-field--full">
							<label htmlFor="email" className="signup-label">
								Email
							</label>
							<input id="email" name="email" type="email" placeholder="exemplo@email.com" className="signup-input" autoComplete="email" />
						</div>
					</div>
				</section>

				<section className="signup-section">
					<div className="signup-section-title">
						<h2>Segurança</h2>
						<p>Defina uma senha forte para proteger sua conta.</p>
					</div>

					<div className="signup-grid signup-grid--security">
						<div className="signup-field">
							<label htmlFor="password" className="signup-label">
								Senha
							</label>
							<div className="signup-input-wrap">
								<input id="password" name="password" type="password" placeholder="••••••••" className="signup-input" autoComplete="new-password" />
							</div>

							<ul className="signup-rules">
								<li>Pelo menos 8 caracteres</li>
								<li>1 letra maiúscula</li>
								<li>1 número</li>
							</ul>
						</div>

						<div className="signup-field">
							<label htmlFor="confirmPassword" className="signup-label">
								Confirmar senha
							</label>
							<div className="signup-input-wrap">
								<input id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••" className="signup-input" autoComplete="new-password" />
							</div>
							<p className="signup-hint">Digite novamente para evitar erro de digitação.</p>
						</div>
					</div>

					<div className="signup-row">
						<label className="signup-check">
							<input type="checkbox" name="terms" />
							<span>
								Concordo com os <a href="#termos">termos</a> e a <a href="#privacidade">política de privacidade</a>.
							</span>
						</label>

						<div className="signup-actions">
							<button type="submit" className="signup-button">
								Criar conta
							</button>
							<p className="signup-mini">
								Já tem conta?{" "}
								<Link to="/login" className="signup-link">
									Entrar
								</Link>
							</p>
						</div>
					</div>
				</section>

				{actionData && <div className="signup-error">{actionData}</div>}
			</Form>

			<footer className="signup-footer">
				<div className="signup-footnote">
					<span className="signup-dot" />
					Seus dados ficam protegidos e você pode ajustar tudo depois.
				</div>
			</footer>
		</main>
	);
}

export default SignUp;

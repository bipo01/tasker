import { useRef } from "react";
import { useState } from "react";
import { Form, useNavigate, useRouteLoaderData } from "react-router-dom";
import api from "../../utils/api";

function SettingsAccount() {
	const user = useRouteLoaderData("auth-required");
	const navigate = useNavigate();

	const [isDifferent, setIsDifferent] = useState(false);
	const [canChangePassword, setCanChangePassword] = useState(false);

	const currentPassword = useRef(null);
	const newPassword = useRef(null);
	const confirmNewPassword = useRef(null);

	const [userInfo, setUserInfo] = useState({
		name: user.name,
		username: user.username,
		email: user.email,
	});

	const [prevUser, setPrevUser] = useState(user);

	if (user.name !== prevUser.name || user.username !== prevUser.username || user.email !== prevUser.email) {
		setPrevUser(user);
		setUserInfo({
			name: user.name,
			username: user.username,
			email: user.email,
		});
		setIsDifferent(false);
	}

	function handleChange(e) {
		const name = e.target.name;
		const value = e.target.value;

		if (!value.trim().length) return;

		setUserInfo((prev) => {
			const userInfo = { ...prev, [name]: value.trim() };
			if (user.name !== userInfo.name || user.username !== userInfo.username || user.email !== userInfo.email) {
				setIsDifferent(true);
			} else {
				setIsDifferent(false);
			}
			return userInfo;
		});
	}

	function handlePasswordChange(e) {
		e.target.value = e.target.value.replaceAll(" ", "");

		const currentPasswordValue = currentPassword.current.value;
		const newPasswordValue = newPassword.current.value;
		const confirmNewPasswordValue = confirmNewPassword.current.value;

		if ([currentPasswordValue, newPasswordValue, confirmNewPasswordValue].every((inp) => inp.trim().length >= 4) && newPasswordValue === confirmNewPasswordValue && currentPasswordValue !== confirmNewPasswordValue) {
			setCanChangePassword(true);
		} else {
			setCanChangePassword(false);
		}
	}

	async function handleSubmitPasswordChange(e) {
		e.preventDefault();
		const currentPasswordValue = currentPassword.current.value;
		const newPasswordValue = newPassword.current.value;
		const confirmNewPasswordValue = confirmNewPassword.current.value;

		if ([currentPasswordValue, newPasswordValue, confirmNewPasswordValue].every((inp) => inp.trim().length) && newPasswordValue === confirmNewPasswordValue && currentPasswordValue !== confirmNewPasswordValue) {
			const res = await api.put("/user/change-password", { currentPasswordValue, newPasswordValue, confirmNewPasswordValue });

			if (res.status !== 201) return alert(res.data?.message);

			currentPassword.current.value = "";
			newPassword.current.value = "";
			confirmNewPassword.current.value = "";

			setCanChangePassword(false);
		}
	}

	async function handleDeleteAccount() {
		if (window.confirm("Você tem certeza que deseja DELETAR SUA CONTA E APAGAR TODOS OS SEUS DADOS?")) {
			const checkPrompt = window.prompt(`Digite "DELETAR CONTA" abaixo para continuar com a ação de deletar sua conta.`);

			if (checkPrompt !== "DELETAR CONTA") {
				return alert("A ação não foi concluída");
			}

			const res = await api.delete("/user");

			if (res.status !== 204) return alert("Erro ao deletar a conta");

			navigate("/");
		}
	}

	return (
		<div className="settings-account-container">
			<header className="content-header">
				<h2 className="content-title">Configurações da Conta</h2>
				<p className="content-subtitle">Gerencie suas informações pessoais, segurança e dados da conta.</p>
			</header>

			{/* SEÇÃO 1: Editar Perfil */}
			<section className="personal-info-section">
				<div className="section-header">
					<h3>Editar Perfil</h3>
				</div>

				<Form method="post" className="info-grid">
					<div className="info-group">
						<label>Nome Completo</label>
						<input type="text" className="settings-input" name="name" onChange={handleChange} value={userInfo.name} />
					</div>

					<div className="info-group">
						<label>Username</label>
						<input type="text" className="settings-input" name="username" onChange={handleChange} value={userInfo.username} />
					</div>

					<div className="info-group full-width">
						<label>E-mail</label>
						<input type="email" className="settings-input" name="email" onChange={handleChange} value={userInfo.email} />
					</div>

					{isDifferent && (
						<div className="info-group full-width settings-actions">
							<button type="submit" className="btn-save">
								Salvar Alterações
							</button>
						</div>
					)}
				</Form>
			</section>

			<hr className="divider" />

			{/* SEÇÃO 2: Alterar Senha */}
			<section className="personal-info-section">
				<div className="section-header">
					<h3>Segurança e Senha</h3>
				</div>

				<form onSubmit={handleSubmitPasswordChange} className="info-grid">
					<div className="info-group full-width">
						<label>Senha Atual</label>
						<input ref={currentPassword} onChange={handlePasswordChange} name="currentPassword" type="password" className="settings-input" placeholder="Digite sua senha atual" />
					</div>

					<div className="info-group">
						<label>Nova Senha</label>
						<input ref={newPassword} onChange={handlePasswordChange} name="newPassword" type="password" className="settings-input" placeholder="Mínimo 8 caracteres" />
					</div>

					<div className="info-group">
						<label>Confirmar Nova Senha</label>
						<input ref={confirmNewPassword} onChange={handlePasswordChange} name="confirmNewPassword" type="password" className="settings-input" placeholder="Repita a nova senha" />
					</div>

					{canChangePassword && (
						<div className="info-group full-width settings-actions">
							<button type="submit" className="btn-save">
								Atualizar Senha
							</button>
						</div>
					)}
				</form>
			</section>

			<hr className="divider" />

			{/* SEÇÃO 3: Zona de Perigo */}
			<section className="personal-info-section danger-zone">
				<div className="section-header">
					<h3 className="danger-title">Zona de Perigo</h3>
				</div>

				<div className="danger-content">
					<div className="danger-text">
						<h4>Deletar conta permanentemente</h4>
						<p>Ao deletar sua conta, todos os seus workspaces, projetos e tarefas serão removidos para sempre. Esta ação não pode ser desfeita.</p>
					</div>
					<button onClick={handleDeleteAccount} type="button" className="btn-delete-account">
						Deletar minha conta
					</button>
				</div>
			</section>
		</div>
	);
}

export default SettingsAccount;

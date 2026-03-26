import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import ButtonBack from "../components/ui/ButtonBack";
import { useQuery } from "@tanstack/react-query";
import { getWorkspaces, queryClient } from "../utils/http";
import { useRef } from "react";
import api from "../utils/api";
import DeleteWorkspace from "../components/app/DeleteWorkspace";

function EditWorkspace() {
	const [searchResults, setSearchResults] = useState([]);
	const [isDifferent, setIsDifferent] = useState(false);

	const titleRef = useRef(null);
	const descriptionRef = useRef(null);
	const modalRef = useRef(null);
	const searchBarRef = useRef(null);

	const { id } = useParams();
	const { data: workspace, isPending } = useQuery({
		queryKey: ["workspaces", id],
		queryFn: ({ signal }) => getWorkspaces({ signal, id }),
	});

	async function handleSearchUser() {
		const value = searchBarRef.current.value;
		if (!value.trim()) {
			searchBarRef.current.value = "";
			setSearchResults([]);
			return;
		}

		const res = await api.get(`/user/find?value=${value}`);

		if (res.status !== 200) return setSearchResults([]);

		console.log(res.data);

		return setSearchResults(res.data.filter((user) => !workspace.users_id.includes(user.id)));
	}

	async function inviteUser(userId, username) {
		const res = await api.post(`/workspaces/${id}/invite`, { userId, username });
		if (res.status !== 201) return alert("Erro ao convidar esse usuário ao workspace");

		console.log(res.data);

		queryClient.setQueryData(["workspaces", id], (oldData) => {
			if (!oldData) return oldData;

			const invitations = [...oldData.invitations, res.data];

			return { ...oldData, invitations };
		});
	}

	async function uninviteUser(userId, username) {
		if (!window.confirm("Tem certeza que deseja cancelar o convite para esse usuário?")) {
			return;
		}

		const res = await api.post(`/workspaces/${id}/uninvite`, { userId, username });
		if (res.status !== 200) return alert("Erro ao desconvidar esse usuário ao workspace");

		queryClient.setQueryData(["workspaces", id], (oldData) => {
			if (!oldData) return oldData;

			const invitations = oldData.invitations.filter((invitation) => invitation.id !== res.data.id);

			return { ...oldData, invitations };
		});
	}

	function handleChange() {
		const titleValue = titleRef.current.value.trim();
		const descriptionValue = descriptionRef.current.value.trim();

		if (titleValue !== workspace.title || descriptionValue !== workspace.description) {
			return setIsDifferent(true);
		} else {
			return setIsDifferent(false);
		}
	}

	async function handleSubmit(e) {
		e.preventDefault();

		const titleValue = titleRef.current.value.trim();
		const descriptionValue = descriptionRef.current.value.trim();

		if (!titleValue || !descriptionValue) return alert("Por favor, preencha todos os campos!");

		const res = await api.put(`workspaces/${id}`, { title: titleValue, description: descriptionValue });

		if (res.status !== 201) return alert("Erro ao editar esse workspace");

		queryClient.setQueryData(["workspaces", id], (oldData) => {
			if (!oldData) return oldData;

			return { ...oldData, title: res.data.title, description: res.data.description };
		});

		return setIsDifferent(false);
	}

	async function removeMember(userId) {
		const res = await api.post(`/workspaces/${id}/remove-member`, { userId });

		if (res.status !== 200) return alert("Erro ao editar esse workspace");

		const workspace = res.data;

		queryClient.setQueryData(["workspaces", id], (oldData) => {
			if (!oldData) return oldData;

			const usersUpdatedId = [...workspace.users_id];
			const filteredUsers = oldData.users.filter((user) => usersUpdatedId.includes(user.id));
			const users_id = oldData.users_id.filter((user) => usersUpdatedId.includes(user));
			const admins_id = oldData.admins_id.filter((user) => usersUpdatedId.includes(user));

			return { ...oldData, users: filteredUsers, users_id, admins_id };
		});
	}

	async function updateAdmin(userId) {
		const res = await api.post(`/workspaces/${id}/update-admin`, { userId });

		if (res.status !== 200) return alert("Erro ao editar esse workspace");

		const workspace = res.data;

		queryClient.setQueryData(["workspaces", id], (oldData) => {
			if (!oldData) return oldData;

			return { ...oldData, admins_id: workspace.admins_id };
		});
	}

	if (isPending) return <p>Carregando...</p>;

	return (
		<>
			<ButtonBack />
			<div className="edit-workspace-container">
				<header className="edit-header">
					<h1 className="edit-title">Editar Workspace</h1>
					<p className="edit-subtitle">Ajuste os detalhes e gerencie quem tem acesso a este espaço.</p>
				</header>

				<form onSubmit={handleSubmit} className="edit-form-layout">
					{/* SEÇÃO 1: Detalhes do Workspace */}
					<section className="form-section">
						<h2 className="section-title">Detalhes</h2>

						<div className="form-group">
							<label htmlFor="ws-title">Título do Workspace</label>
							<input ref={titleRef} id="ws-title" type="text" className="input-field" onChange={handleChange} defaultValue={workspace.title} placeholder="Ex: Marketing Campaign" required />
						</div>

						<div className="form-group">
							<label htmlFor="ws-desc">Descrição</label>
							<textarea ref={descriptionRef} id="ws-desc" className="textarea-field" onChange={handleChange} defaultValue={workspace.description} placeholder="Descreva o propósito deste workspace..." rows="4" />
						</div>
					</section>

					<hr className="divider" />

					{/* SEÇÃO 2: Membros */}
					<section className="form-section">
						<h2 className="section-title">Membros</h2>

						{/* Barra de Busca com Botão */}
						<div className="form-group search-group-wrapper">
							<label htmlFor="ws-search">Adicionar novo membro</label>
							<div className="search-action-row">
								<div className="search-container">
									<svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<circle cx="11" cy="11" r="8"></circle>
										<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
									</svg>
									<input ref={searchBarRef} id="ws-search" type="text" className="input-field search-input" placeholder="Busque por nome ou username..." />
								</div>
								<button onClick={handleSearchUser} type="button" className="btn-secondary btn-search">
									Buscar
								</button>
							</div>

							{/* Container Dinâmico de Resultados */}
							{searchResults.length > 0 && (
								<div className="search-results-box">
									<h4 className="results-title">Resultados Encontrados</h4>
									{searchResults.map((user) => (
										<div key={user.id} className="search-result-item">
											<div className="member-info">
												<div className="member-avatar">{user.name.charAt(0).toUpperCase()}</div>
												<div className="member-details">
													<span className="member-name">{user.name}</span>
													<span className="member-username">@{user.username}</span>
												</div>
											</div>
											{workspace.invitations.map((invitation) => invitation.receiver_id).includes(user.id) ? (
												<button onClick={() => uninviteUser(user.id, user.username)} type="button" className="btn-add-member btn-invited">
													Convidado
												</button>
											) : (
												<button onClick={() => inviteUser(user.id, user.username)} type="button" className="btn-add-member">
													Convidar
												</button>
											)}
										</div>
									))}
								</div>
							)}
						</div>

						{/* Lista de Membros Atuais */}
						<div className="members-list">
							<h3 className="members-list-title">Membros Atuais ({workspace.users.length})</h3>
							{workspace.users
								.filter((member) => member.id === workspace.creator_id)
								.map((member) => {
									return (
										<div key={member.id} className="member-item creator-item">
											<div className="member-info">
												<div className="member-avatar">{member.name.charAt(0).toUpperCase()}</div>
												<div className="member-details">
													<span className="member-name">{member.name}</span>
													<span className="member-username">@{member.username}</span>
												</div>
											</div>
											<div className="member-actions">
												<span className="admin-badge">Criador</span>{" "}
											</div>
										</div>
									);
								})}
							{workspace.users
								.filter((user) => user.id !== workspace.creator_id && workspace.admins_id.includes(user.id))
								.map((member) => {
									return (
										<div key={member.id} className="member-item">
											<div className="member-info">
												<div className="member-avatar">{member.name.charAt(0).toUpperCase()}</div>
												<div className="member-details">
													<span className="member-name">{member.name}</span>
													<span className="member-username">@{member.username}</span>
												</div>
											</div>
											<div className="member-actions">
												<button onClick={() => removeMember(member.id)} type="button" className="btn-remove-member" aria-label="Remover membro">
													Remover
												</button>

												<>
													<button onClick={() => updateAdmin(member.id)} type="button" className="btn-promote">
														Remover Admin
													</button>
													<span className="admin-badge">Admin</span>{" "}
												</>
											</div>
										</div>
									);
								})}

							{workspace.users
								.filter((user) => user.id !== workspace.creator_id && !workspace.admins_id.includes(user.id))
								.map((member) => {
									return (
										<div key={member.id} className="member-item">
											<div className="member-info">
												<div className="member-avatar">{member.name.charAt(0).toUpperCase()}</div>
												<div className="member-details">
													<span className="member-name">{member.name}</span>
													<span className="member-username">@{member.username}</span>
												</div>
											</div>
											<div className="member-actions">
												<button onClick={() => removeMember(member.id)} type="button" className="btn-remove-member" aria-label="Remover membro">
													Remover
												</button>

												<button onClick={() => updateAdmin(member.id)} type="button" className="btn-promote">
													Promover a Admin
												</button>
											</div>
										</div>
									);
								})}
						</div>
					</section>

					{/* AÇÕES DO FORMULÁRIO */}
					<div className="form-actions">
						<button onClick={() => modalRef.current.showModal()} className="btn-delete-workspace">
							Deletar Workspace
						</button>
						<Link to="/workspaces" className="btn-secondary">
							Cancelar
						</Link>

						{isDifferent && (
							<button type="submit" className="btn-primary">
								Salvar Alterações
							</button>
						)}
					</div>
				</form>
			</div>
			<DeleteWorkspace ref={modalRef} />
		</>
	);
}

export default EditWorkspace;

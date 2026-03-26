import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getWorkspaces, queryClient } from "../../../utils/http";
import { useQuery } from "@tanstack/react-query";
import ProjectMembers from "./ProjectMembers";
import api from "../../../utils/api";

function FormEditProject({ modalRef }) {
	const { projectId: id, id: workspaceId } = useParams();

	const [searchResults, setSearchResults] = useState([]);
	const [isDifferent, setIsDifferent] = useState(false);

	// NOVO: Estado para gerenciar a visibilidade.
	// Inicia como null para usar o valor do banco de dados no primeiro render.
	const [isPrivate, setIsPrivate] = useState(null);

	const titleRef = useRef(null);
	const descriptionRef = useRef(null);
	const tagRef = useRef(null);
	const searchBarRef = useRef(null);

	const { data: workspace, isPending } = useQuery({
		queryKey: ["workspaces", workspaceId],
		queryFn: ({ signal }) => getWorkspaces({ signal, id: workspaceId }),
	});
	if (isPending) return <p>Carregando...</p>;

	// Movi a busca do projeto para cá para que as funções abaixo tenham acesso a ele com segurança
	const project = workspace?.projects.find((p) => p.id == id);
	// Define qual é o valor atual da visibilidade (estado local ou o valor original do banco)
	const currentPrivate = isPrivate !== null ? isPrivate : project?.private;

	// NOVO: Função específica para lidar com a troca de visibilidade
	function handlePrivateChange(value) {
		setIsPrivate(value);

		const titleValue = titleRef.current.value.trim();
		const descriptionValue = descriptionRef.current.value.trim();
		const tagValue = tagRef.current.value.trim();

		// Verifica se qualquer campo está diferente do original (incluindo o novo valor de private)
		if (titleValue !== project.title || descriptionValue !== project.description || tagValue !== project.tag || value !== project.private) {
			setIsDifferent(true);
		} else {
			setIsDifferent(false);
		}
	}

	function handleChange() {
		const titleValue = titleRef.current.value.trim();
		const descriptionValue = descriptionRef.current.value.trim();
		const tagValue = tagRef.current.value.trim();

		if (titleValue !== project.title || descriptionValue !== project.description || tagValue !== project.tag || currentPrivate !== project.private) {
			return setIsDifferent(true);
		} else {
			return setIsDifferent(false);
		}
	}

	async function handleSubmit(e) {
		e.preventDefault();

		const titleValue = titleRef.current.value.trim();
		const descriptionValue = descriptionRef.current.value.trim();
		const tagValue = tagRef.current.value.trim();

		// NOVO: Enviando o dado de visibilidade para a API
		const res = await api.put(`/projects/${id}`, {
			title: titleValue,
			description: descriptionValue,
			tag: tagValue,
			private: currentPrivate,
		});

		if (res.status !== 201) return alert(res.data?.message);

		const updatedProject = res.data;

		queryClient.setQueryData(["workspaces", workspaceId], (oldData) => {
			if (!oldData) return oldData;

			const projects = [...oldData.projects.filter((p) => p.id !== updatedProject.id), updatedProject].sort((a, b) => a.id - b.id);

			return {
				...oldData,
				projects,
			};
		});

		setIsDifferent(false);
		setSearchResults([]);
	}

	async function handleSearchUser() {
		const value = searchBarRef.current.value;
		if (!value.trim()) {
			searchBarRef.current.value = "";
			setSearchResults([]);
			return;
		}

		return setSearchResults(
			workspace.users
				.filter((user) => user.username.toLowerCase().includes(value.trim().toLowerCase()) || user.name.toLowerCase().includes(value.trim().toLowerCase()))
				.filter((user) => {
					// if (project.users_id.length === 0) return;

					return !project.users_id.includes(user.id) && !workspace.admins_id.includes(user.id) && !project.admins_id.includes(user.id);
				}),
		);
	}

	async function addUser(userId, username) {
		const res = await api.post(`/projects/${id}/add-member`, { userId, username });

		if (res.status !== 201) return alert("Erro ao alterar projeto");

		const updatedProject = res.data;

		queryClient.setQueryData(["workspaces", workspaceId], (oldData) => {
			if (!oldData) return oldData;

			const projects = [...oldData.projects.filter((p) => p.id !== updatedProject.id), updatedProject].sort((a, b) => a.id - b.id);

			return { ...oldData, projects };
		});

		setSearchResults((old) => old.filter((user) => user.id !== userId));
	}

	async function removeMember(userId, username) {
		const res = await api.post(`/projects/${id}/delete-member`, { userId, username });

		if (res.status !== 201) {
			return alert(res.data.message);
		}

		const updatedProject = res.data;

		queryClient.setQueryData(["workspaces", workspaceId], (oldData) => {
			if (!oldData) return oldData;

			const projects = [...oldData.projects.filter((p) => p.id !== updatedProject.id), updatedProject].sort((a, b) => a.id - b.id);

			return { ...oldData, projects };
		});

		const value = searchBarRef.current?.value;
		if (!value.trim()) {
			searchBarRef.current.value = "";
			setSearchResults([]);
			return;
		}

		return setSearchResults(
			workspace.users
				.filter((user) => user.username.toLowerCase().includes(value.trim().toLowerCase()) || user.name.toLowerCase().includes(value.trim().toLowerCase()))
				.filter((user) => {
					return ![...project.users_id, ...workspace.admins_id, ...project.admins_id].includes(user.id) || user.id === userId;
				}),
		);
	}

	async function updateAdmin(userId, username) {
		const res = await api.post(`/projects/${id}/update-admin`, { userId, username });

		if (res.status !== 201) return alert(res.data?.message);

		const updatedProject = res.data;

		queryClient.setQueryData(["workspaces", workspaceId], (oldData) => {
			if (!oldData) return oldData;

			const projects = [...oldData.projects.filter((p) => p.id !== updatedProject.id), updatedProject].sort((a, b) => a.id - b.id);

			return {
				...oldData,
				projects,
			};
		});
	}

	return (
		<form onSubmit={handleSubmit} className="edit-form-layout">
			{/* SEÇÃO 1: Detalhes do Projeto */}
			<section className="form-section">
				<h2 className="section-title">Detalhes</h2>

				<div className="form-group">
					<label htmlFor="proj-title">Título do Projeto</label>
					<input ref={titleRef} id="proj-title" type="text" className="input-field" onChange={handleChange} defaultValue={project.title} placeholder="Ex: App Mobile" required />
				</div>

				<div className="form-group">
					<label htmlFor="proj-desc">Descrição</label>
					<textarea ref={descriptionRef} id="proj-desc" className="textarea-field" onChange={handleChange} defaultValue={project.description} placeholder="Descreva o propósito deste projeto..." rows="4" />
				</div>

				<div className="form-group">
					<label htmlFor="proj-tag">Categoria (Tag)</label>
					<input ref={tagRef} id="proj-tag" type="text" className="input-field" onChange={handleChange} defaultValue={project.tag} placeholder="Ex: FRONTEND, BACKEND, DESIGN" />
				</div>

				{/* NOVO CAMPO: Visibilidade */}
				<div className="form-group">
					<label>Visibilidade</label>
					<div className="visibility-options">
						<label className={`radio-card ${!currentPrivate ? "selected" : ""}`}>
							<input type="radio" name="private" value="false" checked={!currentPrivate} onChange={() => handlePrivateChange(false)} />
							Pública
						</label>
						<label className={`radio-card ${currentPrivate ? "selected" : ""}`}>
							<input type="radio" name="private" value="true" checked={currentPrivate} onChange={() => handlePrivateChange(true)} />
							Privada
						</label>
					</div>
				</div>
			</section>

			<ProjectMembers isPrivate={currentPrivate} handleSearchUser={handleSearchUser} searchBarRef={searchBarRef} searchResults={searchResults} addUser={addUser} project={project} workspace={workspace} removeMember={removeMember} updateAdmin={updateAdmin} />

			{/* AÇÕES DO FORMULÁRIO */}
			<div className="form-actions">
				<button type="button" onClick={() => modalRef.current?.showModal()} className="btn-delete-project">
					Deletar Projeto
				</button>

				<Link to={-1} relative="path" className="btn-secondary">
					Cancelar
				</Link>

				{isDifferent && (
					<button type="submit" className="btn-primary">
						Salvar Alterações
					</button>
				)}
			</div>
		</form>
	);
}

export default FormEditProject;

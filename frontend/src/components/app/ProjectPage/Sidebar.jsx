import { MessageSquareText } from "lucide-react";
import { Globe } from "lucide-react";
import { NavLink, useParams } from "react-router-dom";
import ButtonBack from "../../ui/ButtonBack";
import { Search } from "lucide-react";
import { ListTodo } from "lucide-react";

import { useGetLengthMessages } from "../../../hooks/useNotificationsLength";

function Sidebar({ tasks, filters, setFilters, users_project }) {
	const tags = [...new Set(tasks.map((task) => task.tag.toUpperCase()))];
	const { projectId } = useParams();

	const { messagesLength, isPending } = useGetLengthMessages(projectId);

	if (isPending) return <p>Carregando...</p>;

	return (
		<aside className="project-sidebar">
			<div className="sidebar-header">
				<ButtonBack goTo="../.." path={{ relative: "path" }} />
				<div className="sidebar-brand">
					<div className="sidebar-logo">Tasker</div>
					<p className="sidebar-subtitle">Project Workspace</p>
				</div>

				<div className="sidebar-search">
					<div className="input-ico">
						<Search className="ico ico--muted" aria-hidden="true" />
						<input
							id="searchBar"
							name="searchBar"
							placeholder="Procurar tasks..."
							value={filters.searchBar}
							onChange={(e) =>
								setFilters((prev) => {
									return { ...prev, [e.target.id]: e.target.value };
								})
							}
						/>
					</div>
				</div>
			</div>

			<nav className="sidebar-nav">
				<div className="sidebar-block">
					<p className="sidebar-block-title">Filtros Gerais</p>
					<div className="filter-grid">
						<div className="filter-field">
							<label className="filter-label" htmlFor="selectByPrio">
								Prioridade
							</label>
							<select
								id="selectByPrio"
								name="selectByPrio"
								value={filters.selectByPrio}
								onChange={(e) =>
									setFilters((prev) => {
										return { ...prev, [e.target.id]: e.target.value };
									})
								}>
								<option value="">Todas</option>
								<option value="low">Baixa</option>
								<option value="med">Média</option>
								<option value="high">Alta</option>
							</select>
						</div>

						<div className="filter-field">
							<label className="filter-label" htmlFor="selectByTag">
								Tag
							</label>
							<select
								id="selectByTag"
								name="selectByTag"
								value={filters.selectByTag}
								onChange={(e) =>
									setFilters((prev) => {
										return { ...prev, [e.target.id]: e.target.value };
									})
								}>
								<option value="">Todas</option>
								{tags.map((tag) => (
									<option key={tag} value={tag}>
										{tag}
									</option>
								))}
							</select>
						</div>
					</div>
					<div className="filter-grid">
						<div className="filter-field">
							<label className="filter-label" htmlFor="selectByPrio">
								Responsável
							</label>
							<select
								id="selectByOwner"
								name="selectByOwner"
								value={filters.selectByOwner}
								onChange={(e) =>
									setFilters((prev) => {
										return { ...prev, [e.target.id]: e.target.value };
									})
								}>
								<option value="">Qualquer</option>
								{users_project.map((user) => (
									<option key={user.id} value={user.id}>
										{user.name}
									</option>
								))}
							</select>
						</div>

						<div className="filter-field">
							<label className="filter-label" htmlFor="selectByCreator">
								Criador
							</label>
							<select
								id="selectByCreator"
								name="selectByCreator"
								value={filters.selectByCreator}
								onChange={(e) =>
									setFilters((prev) => {
										return { ...prev, [e.target.id]: e.target.value };
									})
								}>
								<option value="">Qualquer</option>
								{users_project.map((user) => (
									<option key={user.id} value={user.id}>
										{user.name}
									</option>
								))}
							</select>
						</div>
					</div>
				</div>

				<div className="sidebar-block">
					<p className="sidebar-block-title">Menu</p>
					<div className="sidebar-links">
						<NavLink className="sidebar-link" to="tasks">
							<span className="sidebar-ico" aria-hidden="true">
								<ListTodo className="ico" />
							</span>
							<span>Tarefas</span>
						</NavLink>
						<NavLink className="sidebar-link" to="messages">
							<span className="sidebar-ico" aria-hidden="true">
								<MessageSquareText className="ico" />
							</span>
							<span>Mensagens</span>
							{messagesLength ? <span className="sidebar-pill">{messagesLength}</span> : ""}
						</NavLink>
						<NavLink className="sidebar-link" to="chat">
							<span className="sidebar-ico" aria-hidden="true">
								<Globe className="ico" />
							</span>
							<span>Chat Global</span>
						</NavLink>
					</div>
				</div>
			</nav>
		</aside>
	);
}

export default Sidebar;

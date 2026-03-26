import AddNewMember from "./AddNewMember";

function ProjectMembers({ handleSearchUser, searchBarRef, searchResults, addUser, project, workspace, removeMember, updateAdmin, isPrivate }) {
	const workspace_creator_content = workspace.users
		.filter((member) => member.id === workspace.creator_id)
		.map((member) => {
			let text;
			if (member.id === project.creator_id) {
				text = "Criador do Projeto e do Workspace";
			} else {
				text = "Criador do Workspace";
			}
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
						<span className="admin-badge">{text}</span>{" "}
					</div>
				</div>
			);
		});

	const project_creator_content = workspace.users
		.filter((member) => member.id === project.creator_id && member.id !== workspace.creator_id)
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
						<span className="admin-badge">Criador do Projeto</span>{" "}
					</div>
				</div>
			);
		});

	const workspace_admins_content = workspace.users
		.filter((user) => user.id !== workspace.creator_id && workspace.admins_id.includes(user.id) && user.id !== project.creator_id)
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
						<span className="admin-badge">Admin do WORKSPACE</span>{" "}
					</div>
				</div>
			);
		});

	const project_admins_content = workspace.users
		.filter((user) => user.id !== workspace.creator_id && !workspace.admins_id.includes(user.id) && project.admins_id.includes(user.id) && user.id !== project.creator_id)
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
						{project.private ? (
							<button onClick={() => removeMember(member.id, member.username)} type="button" className="btn-remove-member" aria-label="Remover membro">
								Remover
							</button>
						) : (
							""
						)}

						<>
							<button onClick={() => updateAdmin(member.id)} type="button" className="btn-promote">
								Remover Admin
							</button>
							<span className="admin-badge">Admin do Projeto</span>{" "}
						</>
					</div>
				</div>
			);
		});

	const users_content_isPrivate = workspace.users
		.filter((user) => user.id !== workspace.creator_id && !workspace.admins_id.includes(user.id) && project.users_id.includes(user.id) && !project.admins_id.includes(user.id) && user.id !== project.creator_id)
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
						{project.private ? (
							<button onClick={() => removeMember(member.id, member.username)} type="button" className="btn-remove-member" aria-label="Remover membro">
								Remover
							</button>
						) : (
							""
						)}

						<button onClick={() => updateAdmin(member.id)} type="button" className="btn-promote">
							Promover a Admin
						</button>
					</div>
				</div>
			);
		});

	const users_content = workspace.users
		.filter((user) => user.id !== workspace.creator_id && !workspace.admins_id.includes(user.id) && !project.admins_id.includes(user.id) && user.id !== project.creator_id)
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
						{project.private ? (
							<button onClick={() => removeMember(member.id, member.username)} type="button" className="btn-remove-member" aria-label="Remover membro">
								Remover
							</button>
						) : (
							""
						)}

						<button onClick={() => updateAdmin(member.id)} type="button" className="btn-promote">
							Promover a Admin
						</button>
					</div>
				</div>
			);
		});

	const membersAmount = project.private ? [...new Set([...workspace.admins_id, ...project.users_id])].length : workspace.users.length;

	return (
		<>
			{/* SEÇÃO 2: Membros */}
			<section className="form-section">
				{project.private && isPrivate ? <AddNewMember handleSearchUser={handleSearchUser} searchBarRef={searchBarRef} searchResults={searchResults} addUser={addUser} /> : ""}

				{/* Lista de Membros Atuais (Mock Visual) */}
				<div className="members-list">
					<h3 className="members-list-title">Membros Atuais ({membersAmount})</h3>

					{workspace_creator_content}

					{project_creator_content}

					{workspace_admins_content}

					{project_admins_content}

					{!project.private ? users_content : users_content_isPrivate}
				</div>
			</section>
		</>
	);
}

export default ProjectMembers;

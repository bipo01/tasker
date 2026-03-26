function AddNewMember({ handleSearchUser, searchBarRef, searchResults, addUser }) {
	return (
		<div className="form-group search-group-wrapper">
			<label htmlFor="proj-search">Adicionar novo membro (O usuário deve ser membro deste workspace)</label>
			<div className="search-action-row">
				<div className="search-container">
					<svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<circle cx="11" cy="11" r="8"></circle>
						<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
					</svg>
					<input onChange={handleSearchUser} ref={searchBarRef} id="proj-search" type="text" className="input-field search-input" placeholder="Busque por nome ou username..." />
				</div>
			</div>

			{/* Container Dinâmico de Resultados (Mantido para sua lógica) */}
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

							<button onClick={() => addUser(user.id, user.username)} type="button" className="btn-add-member">
								Adicionar
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export default AddNewMember;

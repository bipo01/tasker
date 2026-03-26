function Footer() {
	const currentYear = new Date().getFullYear();

	return (
		<footer className="app-footer">
			<p>
				<span className="footer-brand">Tasker</span> &bull; &copy; {currentYear} Criado por João Bispo
			</p>
		</footer>
	);
}

export default Footer;

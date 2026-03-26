import { useNavigate } from "react-router-dom";

function ButtonBack({ goTo = -1, path = {}, content = "Voltar" }) {
	const navigate = useNavigate();
	return (
		<button className="btn-back" onClick={() => navigate(goTo, path)}>
			{content}
		</button>
	);
}

export default ButtonBack;

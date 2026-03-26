import { redirect } from "react-router-dom";
import api from "../utils/api";

export async function newTaskAction({ request, params }) {
	const { projectId } = params;
	const formData = await request.formData();
	const body = Object.fromEntries(formData.entries());
	if (formData.getAll("owners_id").length) {
		body.owners_id = formData.getAll("owners_id").map((id) => Number(id));
	}

	const hasEmptyFields = Object.values(body).some((value) => {
		if (typeof value === "string") return !value.trim().length;

		if (Array.isArray(value)) return value.length === 0;
	});

	if (hasEmptyFields) {
		alert("Preencha todos os campos!");
		return null;
	}

	const res = await api.post(`/tasks/new?project_id=${projectId}`, body);

	if (res.status !== 201) {
		alert("Algo deu errado!");
		return null;
	}

	return redirect("..");
}

import { redirect } from "react-router-dom";
import api from "../utils/api";

export async function newProjectAction({ params, request }) {
	const { id } = params;
	const formData = await request.formData();
	const body = Object.fromEntries(formData.entries());
	body.members = formData.getAll("members");
	body.workspace_id = id;

	const res = await api.post(`/projects/new`, body);

	if (res.status !== 201) return alert("Erro ao adicionar um novo projeto a esse workspace");

	return redirect(`/workspaces/${id}`);
}

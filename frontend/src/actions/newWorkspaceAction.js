import { redirect } from "react-router-dom";
import api from "../utils/api";

export async function newWorkspaceAction({ request }) {
	const formData = await request.formData();
	const body = Object.fromEntries(formData.entries());

	await api.post(`/workspaces/new`, body);

	return redirect("/workspaces");
}

import { redirect } from "react-router-dom";
import api from "../utils/api";

export async function editWorkspaceLoader({ params }) {
	const { id } = params;

	const res = await api.get(`/workspaces/${id}/isCreator`);

	if (res.status !== 200) return redirect("/workspaces");

	const workspace = res.data;
	return workspace;
}

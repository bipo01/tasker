import { redirect } from "react-router-dom";
import api from "../utils/api";

export async function editProjectLoader({ params }) {
	const res = await api.get(`/projects/${params.projectId}/isAdmin`);

	if (res.status !== 200) return redirect(`/workspaces/${params.id}`);

	return null;
}

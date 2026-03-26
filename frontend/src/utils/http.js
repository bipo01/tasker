import { QueryClient } from "@tanstack/react-query";
import api from "../utils/api.js";

export const queryClient = new QueryClient();

export async function getWorkspaces({ signal, id }) {
	let url = "/workspaces";

	if (id) {
		url += `/${id}`;
	}

	const res = await api.get(url, { signal: signal });

	const { data } = res;

	if (res.status !== 200) throw new Error("Não autorizado");

	return data;
}

export async function getTasks({ signal, id }) {
	const res = await api.get(`/projects/${id}/getTasks`, { signal: signal });
	const { data } = res;

	if (res.status !== 200) throw new Error("Não autorizado");

	return data;
}

export async function getNotifications() {
	const res = await api.get("/user/notifications");

	if (res.status !== 200) throw new Error("Algo deu errado...");

	return res.data;
}

export async function getUserData() {
	const res = await api.get("/user/data");

	if (res.status !== 200) throw new Error("Algo deu errado...");

	return res.data;
}

export async function getMessages({ signal, projectId, selectedMember, before = null }) {
	let url = !selectedMember ? `projects/${projectId}/messages/global?` : `projects/${projectId}/messages?memberId=${selectedMember}&`;

	const res = await api(`${url}before=${before}`, { signal });

	if (res.status !== 200) return alert("Erro ao carregar as mensagens");

	const messages = res.data;

	return messages;
}

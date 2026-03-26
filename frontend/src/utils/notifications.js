import api from "./api";
import { queryClient } from "./http";

export async function deleteNotification(id) {
	const res = await api.delete(`/user/notifications/${id}`);

	if (res.status !== 201) alert("Algo deu errado");

	const notification = res.data;

	queryClient.setQueryData(["notifications"], (oldData) => {
		if (!oldData) return oldData;

		const notifications = oldData.notifications.filter((n) => n.id !== notification.id);

		return { ...oldData, notifications };
	});
}

export async function toggleSeen(id) {
	const res = await api.put(`/user/notifications`, { id });

	if (res.status !== 201) alert("Algo deu errado");

	const notification = res.data;

	queryClient.setQueryData(["notifications"], (oldData) => {
		if (!oldData) return oldData;

		const notifications = [...oldData.notifications.filter((n) => n.id !== notification.id), notification].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

		return { ...oldData, notifications };
	});
}

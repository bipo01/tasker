import { redirect } from "react-router-dom";
import api from "./api";
import { socket } from "./socket";
import { getNotifications, queryClient } from "./http.js";

export async function authLoader() {
	const res = await api.get("/user/checkAuth");

	if (res.status !== 200) return redirect("/login");

	if (!socket.connected) {
		socket.connect();
	}

	const notifications = await queryClient.fetchQuery({
		queryKey: ["notifications"],
		queryFn: getNotifications,
	});

	return { ...res.data, notifications };
}

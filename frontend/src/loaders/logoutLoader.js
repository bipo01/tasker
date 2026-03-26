import { redirect } from "react-router-dom";
import api from "../utils/api";
import { socket } from "../utils/socket";

export async function logoutLoader() {
	try {
		const res = await api.get("/user/logout");

		if (res.status !== 200) return res.data;
		socket.disconnect();

		return redirect("/login");
	} catch (error) {
		console.log(error);
		return redirect("/");
	}
}

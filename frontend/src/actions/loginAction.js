import { redirect } from "react-router-dom";
import api from "../utils/api";

export async function loginAction({ request }) {
	const formData = await request.formData();
	const body = Object.fromEntries(formData.entries());

	const res = await api.post("/user/sign-in", body);

	if (res.status !== 200) return res.data.message;

	return redirect("/workspaces");
}

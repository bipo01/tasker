import { redirect } from "react-router-dom";
import api from "../utils/api";

export async function signupAction({ request }) {
	const formData = await request.formData();
	const body = Object.fromEntries(formData.entries());

	const res = await api.post("/user/sign-up", body);

	if (res.status !== 201) return res.data.message;
	return redirect("/workspaces");
}

import { redirect } from "react-router-dom";
import api from "../utils/api";

export async function settingsAccountAction({ request }) {
	const formData = await request.formData();
	const body = Object.fromEntries(formData.entries());

	const res = await api.put("/user", body);

	if (res.status !== 201) return alert(res.data?.message);

	return redirect("/account/settings");
}

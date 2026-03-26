import { redirect } from "react-router-dom";
import { getWorkspaces, queryClient } from "../utils/http";

export async function workspaceLoader({ params }) {
	try {
		const data = await queryClient.fetchQuery({
			queryKey: ["workspaces", params.id],
			queryFn: ({ signal }) => getWorkspaces({ signal, id: params.id }),
		});

		return data;
	} catch (error) {
		console.log(error);

		return redirect("/workspaces");
	}
}

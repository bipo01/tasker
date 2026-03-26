import { getTasks, queryClient } from "../utils/http";
import { redirect } from "react-router-dom";

export async function projectLoader({ params }) {
	const id = Number(params.projectId);

	try {
		const { data } = await queryClient.fetchQuery({
			queryKey: ["project", id],
			queryFn: ({ signal }) => getTasks({ signal, id }),
		});

		return data;
	} catch (error) {
		console.log(error);

		return redirect(-1);
	}
}

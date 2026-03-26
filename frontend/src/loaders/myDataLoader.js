import { getUserData, queryClient } from "../utils/http";

export async function myDataLoader() {
	const userData = await queryClient.fetchQuery({
		queryKey: ["user-data"],
		queryFn: getUserData,
	});

	return userData;
}

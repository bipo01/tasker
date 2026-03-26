import { useQuery } from "@tanstack/react-query";
import { getNotifications } from "../utils/http";

export function useGetLengthMessages(projectId, memberId = null) {
	const { data: notifications, isPending } = useQuery({
		queryKey: ["notifications"],
		queryFn: getNotifications,
	});

	if (isPending) return { isPending };

	let messagesLength = notifications.notifications.filter((n) => n.table_name === "message" && n.project_id === Number(projectId));

	if (memberId) {
		messagesLength = messagesLength.filter((n) => n.sender_id === memberId);
	}

	return { messagesLength: messagesLength.length };
}

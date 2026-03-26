import { useParams } from "react-router-dom";
import { useGetLengthMessages } from "../../../hooks/useNotificationsLength";
import { useContextData } from "../../../context/context";
import api from "../../../utils/api";

function Member({ member }) {
	const { projectId } = useParams();
	const { messagesLength } = useGetLengthMessages(projectId, member.id);

	const { selectedMember, dispatch } = useContextData();

	async function selectMember(id) {
		await api.get(`projects/${projectId}/messages?memberId=${id}&before=null`);

		dispatch({ type: "selectMember", payload: id });
	}
	return (
		<li onClick={() => selectMember(member.id)} key={member.id} className={`member-item ${selectedMember === member.id ? "member-active" : ""}`}>
			<div className="member-avatar">{member.name.charAt(0).toUpperCase()}</div>
			<span className="member-name">{member.name}</span>
			{messagesLength ? <span className="sidebar-pill">{messagesLength}</span> : ""}
		</li>
	);
}

export default Member;

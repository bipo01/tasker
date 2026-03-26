import { Outlet, useLoaderData, useNavigate, useParams } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useEffect } from "react";
import { socket } from "../../utils/socket";
import { queryClient } from "../../utils/http";
import { useContextData } from "../../context/context";

function AppLayout() {
	const user = useLoaderData();
	const navigate = useNavigate();
	const params = useParams();

	const { selectedMember } = useContextData();

	useEffect(() => {
		socket.on("add-workspace", (workspace) => {
			queryClient.setQueryData(["workspaces"], (oldData) => {
				if (!oldData) return oldData;

				return [...oldData, workspace];
			});
		});

		socket.on("delete-workspace", (workspace) => {
			queryClient.setQueryData(["workspaces"], (oldData) => {
				if (!oldData) return oldData;

				return oldData.filter((ws) => ws.id !== workspace.id);
			});

			if (params.id) {
				navigate(`/workspaces`);
			}
		});

		socket.on("update-workspaces", (workspace) => {
			queryClient.setQueryData(["workspaces"], (oldData) => {
				if (!oldData) return oldData;

				return [...oldData.filter((ws) => ws.id !== workspace.id), workspace].sort((a, b) => a.id - b.id);
			});

			queryClient.setQueryData(["workspaces", String(workspace.id)], (oldData) => {
				if (!oldData) return oldData;

				return { ...oldData, ...workspace };
			});
		});

		socket.on("add-project", (project) => {
			queryClient.setQueryData(["workspaces", String(project.workspace_id)], (oldData) => {
				if (!oldData) return oldData;

				return {
					...oldData,
					projects: [...oldData.projects, project],
				};
			});
		});

		socket.on("delete-project", (project) => {
			queryClient.setQueryData(["workspaces", String(project.workspace_id)], (oldData) => {
				if (!oldData) return oldData;

				return {
					...oldData,
					projects: oldData.projects.filter((p) => p.id !== project.id),
				};
			});

			if (params.projectId) {
				navigate(`/workspaces/${String(project.workspace_id)}`);
			}
		});

		socket.on("update-project", (project) => {
			queryClient.setQueryData(["workspaces", String(project.workspace_id)], (oldData) => {
				if (!oldData) return oldData;

				const isPrivate = project.private;

				if (isPrivate) {
					if (!project.users_id.includes(user.id)) {
						const projects = oldData.projects.filter((p) => p.id !== project.id);

						return {
							...oldData,
							projects,
						};
					} else {
						const projects = [...oldData.projects.filter((p) => p.id !== project.id), project];

						return {
							...oldData,
							projects,
						};
					}
				} else {
					const { users_id } = queryClient.getQueryData(["workspaces", String(project.workspace_id)]);

					if (!users_id.includes(user.id)) {
						const projects = oldData.projects.filter((p) => p.id !== project.id);

						return {
							...oldData,
							projects,
						};
					} else {
						const projects = [...oldData.projects.filter((p) => p.id !== project.id), project];

						return {
							...oldData,
							projects,
						};
					}
				}
			});
		});

		socket.on("new-global-message", (message) => {
			queryClient.setQueryData(["messages", params?.projectId], (oldData) => {
				if (!oldData) return oldData;

				return [...oldData, message];
			});
		});

		socket.on("new-message", (message) => {
			if (message.sender_id === user.id) {
				queryClient.setQueryData(["messages", String(message.project_id), message.receiver_id], (oldData) => {
					if (!oldData) return oldData;

					return [...oldData, message];
				});
			} else {
				queryClient.setQueryData(["messages", String(message.project_id), message.sender_id], (oldData) => {
					if (!oldData) return oldData;

					return [...oldData, message];
				});
			}
		});

		return () => {
			socket.off("add-workspace");
			socket.off("delete-workspace");
			socket.off("update-workspaces");

			socket.off("add-project");
			socket.off("delete-project");
			socket.off("update-project");

			socket.off("new-global-message");
			socket.off("new-message");
		};
	}, [user, navigate, params, selectedMember]);

	return (
		<>
			<Header />
			<Outlet />
			<Footer />
		</>
	);
}

export default AppLayout;

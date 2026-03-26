import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";

import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Workspaces from "./pages/Workspaces";
import Workspace from "./pages/Workspace";
import HomePage from "./pages/HomePage";
import Account from "./pages/Account";
import EditWorkspace from "./pages/EditWorkspace";
import ProjectPage from "./pages/ProjectPage";

import { authLoader } from "./utils/auth";
import { queryClient } from "./utils/http";

import { loginAction } from "./actions/loginAction";
import { signupAction } from "./actions/signupAction";

import { logoutLoader } from "./loaders/logoutLoader";
import { workspaceLoader } from "./loaders/workspaceLoader";
import { projectLoader } from "./loaders/projectLoader";

import MyData from "./components/app/MyData";
import AppLayout from "./components/app/AppLayout";
import NewWorkspace from "./components/app/NewWorkspace";
import { editWorkspaceLoader } from "./loaders/editWorkspaceLoader";
import { newWorkspaceAction } from "./actions/newWorkspaceAction";
import NewProject from "./components/app/NewProject";
import Invitations from "./components/app/Invitations";
import SettingsAccount from "./components/app/SettingsAccount";
import { newProjectAction } from "./actions/newProjectAction";
import EditProject from "./pages/EditProject";
import { editProjectLoader } from "./loaders/editProjectLoader";
import Notifications from "./components/app/Notifications";
import { myDataLoader } from "./loaders/myDataLoader";
import NewTask from "./pages/NewTask";
import { newTaskAction } from "./actions/newTaskAction";
import Tasks from "./components/app/ProjectPage/Tasks";
import Messages from "./components/app/ProjectPage/Messages";
import ContextProvider from "./context/ContextProvider";
import GlobalChat from "./components/app/ProjectPage/GlobalChat";
import ErrorElement from "./components/ui/ErrorElement";
import Task from "./pages/Task";
import EditTask from "./pages/EditTask";
import { settingsAccountAction } from "./actions/settingsAccountAction";

const router = createBrowserRouter([
	{
		id: "root",
		path: "/",
		errorElement: <ErrorElement />,
		children: [
			{ index: true, element: <HomePage /> },
			{ path: "login", element: <Login />, action: loginAction },
			{ path: "signup", element: <SignUp />, action: signupAction },
			{ path: "logout", loader: logoutLoader },

			{
				id: "auth-required",
				element: <AppLayout />,
				loader: authLoader,
				children: [
					{
						path: "account",
						element: <Account />,
						children: [
							{ index: true, element: <MyData />, loader: myDataLoader },
							{ path: "notifications", element: <Notifications /> },
							{ path: "invitations", element: <Invitations /> },
							{ path: "settings", element: <SettingsAccount />, action: settingsAccountAction },
						],
					},
					{
						path: "workspaces",
						element: <Workspaces />,
						children: [
							{
								path: "new",
								element: <NewWorkspace />,
								action: newWorkspaceAction,
							},
						],
					},
					{
						path: "workspaces/:id",
						element: <Workspace />,
						loader: workspaceLoader,
						children: [
							{
								path: "projects/new",
								element: <NewProject />,
								action: newProjectAction,
							},
						],
					},
					{
						path: "workspaces/:id/edit",
						element: <EditWorkspace />,
						loader: editWorkspaceLoader,
					},
					{
						path: "workspaces/:id/projects/:projectId",
						element: <ProjectPage />,
						loader: projectLoader,
						children: [
							{ index: true, element: <Navigate to="tasks" replace /> },
							{
								path: "tasks",
								element: <Tasks />,
								children: [
									{
										path: "new",
										element: <NewTask />,
										action: newTaskAction,
									},
									{
										path: ":taskId",
										element: <Task />,
										children: [
											{
												path: "edit",
												element: <EditTask />,
											},
										],
									},
								],
							},
							{
								path: "messages",
								element: <Messages />,
							},
							{
								path: "chat",
								element: <GlobalChat />,
							},
						],
					},
					{
						path: "workspaces/:id/projects/:projectId/edit",
						element: <EditProject />,
						loader: editProjectLoader,
					},
				],
			},
		],
	},
]);

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<ContextProvider>
				<RouterProvider router={router} />
			</ContextProvider>
		</QueryClientProvider>
	);
}

export default App;

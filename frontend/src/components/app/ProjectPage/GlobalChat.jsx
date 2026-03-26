import { useOutletContext, useParams, useRouteLoaderData } from "react-router-dom";
import { Globe, Users } from "lucide-react";
import { useState } from "react";
import api from "../../../utils/api";
import { useQuery } from "@tanstack/react-query";
import { getMessages, queryClient } from "../../../utils/http";

import { useRef } from "react";
import { useEffect } from "react";
import { useLayoutEffect } from "react";

function GlobalChat() {
	const currentUser = useRouteLoaderData("auth-required");
	const { users_project } = useOutletContext();
	const { projectId } = useParams();

	const [messageText, setMessageText] = useState("");

	const { data: messages, isPending } = useQuery({
		queryKey: ["messages", projectId],
		queryFn: ({ signal }) => getMessages({ signal, projectId }),
		staleTime: 1000 * 60 * 15,
	});

	const chatRef = useRef(null);

	const shouldScrollToBottomRef = useRef(true);
	const isPrependingRef = useRef(false);
	const previousScrollHeightRef = useRef(0);
	const previousScrollTopRef = useRef(0);

	useEffect(() => {
		// quando trocar de projeto, ao abrir o chat vai para baixo
		shouldScrollToBottomRef.current = true;
	}, [projectId]);

	useLayoutEffect(() => {
		const chat = chatRef.current;
		if (!chat || !messages?.length) return;

		// caso tenha carregado mensagens antigas no topo
		if (isPrependingRef.current) {
			const heightDiff = chat.scrollHeight - previousScrollHeightRef.current;
			chat.scrollTop = previousScrollTopRef.current + heightDiff;

			isPrependingRef.current = false;
			return;
		}

		// primeira carga do chat ou quando você quiser forçar scroll pro fim
		if (shouldScrollToBottomRef.current) {
			chat.scrollTop = chat.scrollHeight;
			shouldScrollToBottomRef.current = false;
		}
	}, [messages, projectId]);

	async function sendMessage(e) {
		e.preventDefault();

		if (!messageText.trim()) return;

		shouldScrollToBottomRef.current = true;

		const res = await api.post(`/projects/${projectId}/messages/global`, { text: messageText });

		if (res.status !== 201) return alert("Erro ao enviar a mensagem");

		setMessageText("");
	}

	let content = <div className="chat-history" ref={chatRef}></div>;

	if (isPending)
		content = (
			<div className="chat-history" ref={chatRef}>
				Carregando...
			</div>
		);

	const datesArr = [];
	let senders_id = [];

	if (messages?.length) {
		const firstMessage = messages.at(0);
		const { sent_at } = firstMessage;

		async function getMoreMessages() {
			const chat = chatRef.current;

			if (chat) {
				isPrependingRef.current = true;
				previousScrollHeightRef.current = chat.scrollHeight;
				previousScrollTopRef.current = chat.scrollTop;
			}

			const res = await api.get(`/projects/${projectId}/messages/global?before=${sent_at}`);
			if (res.status !== 200) {
				isPrependingRef.current = false;
				return alert("Erro ao carregar mais mensagens");
			}

			if (!res.data.length) {
				isPrependingRef.current = false;
				return alert("Não há mensagens antigas");
			}
			const newMessages = res.data;

			queryClient.setQueryData(["messages", projectId], (oldData) => {
				if (!oldData) return oldData;

				return [...new Set([...newMessages, ...oldData])];
			});
		}

		content = (
			<div className="chat-history" ref={chatRef}>
				<button onClick={getMoreMessages} className="load-new-messages">
					Carregar mensagens antigas
				</button>
				{messages.map((message) => {
					const user = users_project.find((u) => u.id === message.sender_id);
					const me = user.id === currentUser.id;

					const messageDate = new Date(message.sent_at).getDate();
					const today = new Date().getDate();

					const formattedDate = new Date(message.sent_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

					let insertDate = false;

					if (!datesArr.includes(formattedDate)) {
						datesArr.push(formattedDate);
						insertDate = true;
					}

					const formattedTime = new Date(message.sent_at).toLocaleTimeString("pt-BR", {
						hour: "2-digit",
						minute: "2-digit",
					});

					if (me) {
						let anotherUser = senders_id.at(-1) !== user.id;

						senders_id.push(user.id);

						return (
							<div key={message.id} className={`${anotherUser ? "another" : "user"}`}>
								{insertDate ? (
									<div className="date-divider">
										<span>{messageDate === today ? "Hoje" : formattedDate}</span>
									</div>
								) : (
									""
								)}

								<div className="message-row sent">
									<div className="message-content">
										<div className="message-bubble">
											{message.text}
											<span className="message-time">{formattedTime}</span>
										</div>
									</div>
								</div>
							</div>
						);
					} else {
						let anotherUser = senders_id.at(-1) !== user.id;

						senders_id.push(user.id);

						return (
							<div key={message.id} className={`${anotherUser ? "another" : "user"}`}>
								{insertDate ? (
									<div className="date-divider">
										<span>{messageDate === today ? "Hoje" : formattedDate}</span>
									</div>
								) : (
									""
								)}

								<div className="message-row received">
									<div className="message-avatar">{user.name.at(0)}</div>
									<div className="message-content">
										{anotherUser && <span className="message-sender">{user.name}</span>}
										<div className="message-bubble">
											{message.text}
											<span className="message-time">{formattedTime}</span>
										</div>
									</div>
								</div>
							</div>
						);
					}
				})}
			</div>
		);
	}

	return (
		<div className="global-chat-container">
			{/* Main Chat Area */}
			<main className="chat-main">
				{/* Header */}
				<header className="chat-header">
					<div className="global-icon">
						<Globe size={24} strokeWidth={2} />
					</div>
					<div className="chat-header-info">
						<h2>Chat Geral do Projeto</h2>
						<p>Discussões abertas com todos os membros da equipe</p>
					</div>
				</header>

				{/* History */}
				{content}

				{/* Input Area */}
				<form className="chat-input-area" onSubmit={sendMessage}>
					<input value={messageText} onChange={(e) => setMessageText(e.target.value)} type="text" placeholder="Envie uma mensagem para todos no projeto..." className="chat-input" />
					<button disabled={!messageText.trim()} type="submit" className="btn-send">
						Enviar
					</button>
				</form>
			</main>

			{/* Sidebar Opcional */}
			<aside className="chat-sidebar">
				<div className="sidebar-header">
					<h3 className="sidebar-title">Participantes</h3>
					<p className="sidebar-subtitle">
						<Users size={14} style={{ marginRight: "4px", verticalAlign: "middle" }} />
						{users_project.length} membros no projeto
					</p>
				</div>

				<ul className="participants-list">
					<li className="participant-item participant-item-me">
						<div className="participant-avatar">{currentUser.name.at(0)}</div>
						<span className="participant-name">Você</span>
					</li>
					{users_project
						.sort((a, b) => a.name.localeCompare(b.name))
						.map((user) => {
							const me = user.id === currentUser.id;

							if (me) return;
							return (
								<li key={user.id} className="participant-item">
									<div className="participant-avatar">{user.name.at(0)}</div>
									<span className="participant-name">{user.name}</span>
								</li>
							);
						})}
				</ul>
			</aside>
		</div>
	);
}

export default GlobalChat;

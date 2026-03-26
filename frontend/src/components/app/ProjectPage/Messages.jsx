import { useState } from "react";
import { useOutletContext, useParams, useRouteLoaderData } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { getMessages, queryClient } from "../../../utils/http";
import api from "../../../utils/api";
import { useContextData } from "../../../context/context";
import Member from "./Member";
import { useRef } from "react";
import { useLayoutEffect } from "react";

function Messages() {
	const { users_project } = useOutletContext();
	const currentUser = useRouteLoaderData("auth-required");

	const { projectId } = useParams();

	const { selectedMember, dispatch } = useContextData();

	const [messageText, setMessageText] = useState("");

	const { data: messages, isLoading } = useQuery({
		queryKey: ["messages", projectId, selectedMember],
		queryFn: ({ signal }) => getMessages({ signal, projectId, selectedMember }),
		enabled: selectedMember ? true : false,
		staleTime: 1000 * 60 * 15,
	});

	const members = users_project || [];

	const datesArr = [];

	const chatRef = useRef(null);

	const shouldScrollToBottomRef = useRef(true);
	const isPrependingRef = useRef(false);
	const previousScrollHeightRef = useRef(0);
	const previousScrollTopRef = useRef(0);

	useLayoutEffect(() => {
		shouldScrollToBottomRef.current = true;
		isPrependingRef.current = false;
	}, [selectedMember]);

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
	}, [messages, selectedMember]);

	useEffect(() => {
		return () => {
			dispatch({ type: "selectMember", payload: null });
		};
	}, [dispatch]);

	async function handleSendMessage(e) {
		e.preventDefault();
		if (!messageText.trim()) return;

		shouldScrollToBottomRef.current = true;

		const res = await api.post(`/projects/${projectId}/messages`, { receiver_id: selectedMember, text: messageText });

		if (res.status !== 201) return alert("Erro ao enviar a mensagem");

		setMessageText("");
	}

	const activeMemberData = members.find((m) => m.id === selectedMember);

	let content;

	if (isLoading) content = <div className="chat-history">Carregando...</div>;

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

			const res = await api.get(`projects/${projectId}/messages?memberId=${selectedMember}&before=${sent_at}`);

			if (res.status !== 200) {
				isPrependingRef.current = false;
				return alert("Erro ao carregar mais mensagens");
			}

			if (!res.data.length) {
				isPrependingRef.current = false;
				return alert("Não há mensagens antigas");
			}

			const newMessages = res.data;

			queryClient.setQueryData(["messages", projectId, selectedMember], (oldData) => {
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
					const status = message.sender_id === currentUser?.id ? "sent" : "received";

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

					return (
						<div key={message.id}>
							{insertDate ? (
								<div className="date-divider">
									<span>{messageDate === today ? "Hoje" : formattedDate}</span>
								</div>
							) : (
								""
							)}
							<div className={`message-wrapper ${status}`}>
								<div className="message-bubble">
									<span className="message-text">{message.text}</span>
									<span className="message-time">{formattedTime}</span>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		);
	} else {
		content = <div className="chat-history" ref={chatRef}></div>;
	}

	return (
		<div className="messages-container">
			<aside className="messages-sidebar">
				<h3 className="sidebar-title">Membros do Projeto</h3>

				<ul className="members-list">
					{members
						.filter((member) => member.id !== currentUser?.id)
						.map((member) => (
							<Member key={member.id} member={member} />
						))}
				</ul>
			</aside>

			{!selectedMember ? (
				<main className="messages-main empty">
					<div className="empty-state">
						<p>Selecione um membro para iniciar uma conversa</p>
					</div>
				</main>
			) : (
				<main className="messages-main active-chat">
					{/* Cabeçalho do Chat */}
					<header className="chat-header">
						<div className="chat-header-profile">
							<div className="member-avatar small">{activeMemberData?.name.charAt(0).toUpperCase()}</div>
							<div className="chat-header-info">
								<h4>{activeMemberData?.name}</h4>
							</div>
						</div>

						{/* Botão X para fechar a conversa */}
						<button className="btn-close-chat" onClick={() => dispatch({ type: "selectMember", payload: null })} title="Fechar conversa">
							&times;
						</button>
					</header>

					{/* Área de Mensagens */}

					{content}

					{/* Input de Envio */}
					<form className="chat-input-area" onSubmit={handleSendMessage}>
						<input type="text" placeholder="Escreva sua mensagem..." value={messageText} onChange={(e) => setMessageText(e.target.value)} className="chat-input" />
						<button type="submit" className="btn-send" disabled={!messageText.trim()}>
							Enviar
						</button>
					</form>
				</main>
			)}
		</div>
	);
}

export default Messages;

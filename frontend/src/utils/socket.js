import { io } from "socket.io-client";
export const socket = import.meta.env.MODE === "development" ? io("http://localhost:3000/", { withCredentials: true, autoConnect: false }) : io({ withCredentials: true, autoConnect: false });

import axios from "axios";

const BASE_URL = import.meta.env.MODE === "development" ? `http://localhost:3000/` : "/";

const api = axios.create({
	baseURL: BASE_URL,
	withCredentials: true,
	validateStatus: () => true, // 👈 aceita qualquer status
});

export default api;

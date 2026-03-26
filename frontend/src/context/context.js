import { createContext } from "react";
import { useContext } from "react";

export const Context = createContext();

export function useContextData() {
	const data = useContext(Context);
	return data;
}

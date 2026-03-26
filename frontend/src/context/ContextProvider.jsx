import { useReducer } from "react";
import { Context } from "./context";

const initialState = {
	selectedMember: null,
	lastSelectedMember: undefined,
};

function reducer(state, action) {
	switch (action.type) {
		case "selectMember":
			return { ...state, selectedMember: action.payload };

		case "selectLastMember":
			return { ...state, lastSelectedMember: action.payload };

		case "clearLastMember":
			return { ...state, lastSelectedMember: undefined };

		default:
			return { ...state };
	}
}

function ContextProvider({ children }) {
	const [{ selectedMember, lastSelectedMember }, dispatch] = useReducer(reducer, initialState);
	return <Context.Provider value={{ selectedMember, lastSelectedMember, dispatch }}>{children}</Context.Provider>;
}

export default ContextProvider;

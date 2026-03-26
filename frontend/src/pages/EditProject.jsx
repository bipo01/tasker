import ButtonBack from "../components/ui/ButtonBack";

import HeaderEditProject from "../components/app/EditProject/HeaderEditProject";
import FormEditProject from "../components/app/EditProject/FormEditProject";
import { useRef } from "react";
import DeleteProject from "../components/app/EditProject/DeleteProject";

function EditProject() {
	const modalRef = useRef(null);
	return (
		<>
			<ButtonBack />
			<div className="edit-project-container">
				<HeaderEditProject />

				<FormEditProject modalRef={modalRef} />
			</div>

			<DeleteProject ref={modalRef} />
		</>
	);
}

export default EditProject;

import express from "express";

import { createWorkspace, deleteWorkspace, getWorkspace, getWorkspaces, handleInvitation, inviteMember, isCreator, removeMember, uninviteMember, updateAdmin, updateWorkspace } from "../controllers/workspacesController.js";

const router = express.Router();

router.get("/", getWorkspaces);

router.get("/:id", getWorkspace);
router.get("/:id/isCreator", isCreator);

router.post("/new", createWorkspace);
router.post("/:id/invite", inviteMember);
router.post("/:id/uninvite", uninviteMember);
router.post("/:id/remove-member", removeMember);
router.post("/:id/update-admin", updateAdmin);
router.post("/handle-invitation", handleInvitation);

router.put("/:id", updateWorkspace);

router.delete("/:id", deleteWorkspace);

export default router;

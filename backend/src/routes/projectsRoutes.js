import express from "express";
import { addMember, createProject, deleteMember, deleteProject, getGlobalMessages, getMessages, getProject, getProjects, getTasksFromProject, isCreator, sendGlobalMessage, sendMessage, updateAdmin, updateProject } from "../controllers/projectsController.js";

const router = express.Router();

router.get("/", getProjects);
router.get("/:id", getProject);
router.get("/:id/getTasks", getTasksFromProject);
router.get("/:id/isAdmin", isCreator);
router.get("/:id/messages", getMessages);
router.get("/:projectId/messages/global", getGlobalMessages);

router.post("/new", createProject);
router.post("/:id/add-member", addMember);
router.post("/:id/delete-member", deleteMember);
router.post("/:id/update-admin", updateAdmin);
router.post("/:id/messages", sendMessage);
router.post("/:projectId/messages/global", sendGlobalMessage);

router.put("/:id", updateProject);

router.delete("/:id", deleteProject);

export default router;

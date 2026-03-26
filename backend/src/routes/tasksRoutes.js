import express from "express";
import { attachFiles, createTask, deleteTask, detachFiles, downloadFile, getTasks, updateStatus, updateTask } from "../controllers/tasksController.js";
import upload, { canAttachFile, canDownloadFile } from "../config/multer.js";

const router = express.Router();

router.get("/", getTasks);
router.get("/:id/download/:filename", canDownloadFile, downloadFile);

router.post("/:id/attach", canAttachFile, upload, attachFiles);
router.post("/new", createTask);

router.delete("/:id", deleteTask);

router.put("/:id", updateTask);
router.put("/:id/status", updateStatus);
router.put("/detach/:id", canAttachFile, detachFiles);

export default router;

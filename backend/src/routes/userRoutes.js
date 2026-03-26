import express from "express";
import { changePassword, checkAuth, deleteAccount, deleteNotification, editProfile, findUsers, getData, getNotifications, logOut, signIn, signUp, toggleSeen } from "../controllers/userController.js";
import { auth } from "../config/auth.js";

const router = express.Router();

router.post("/sign-in", signIn);
router.post("/sign-up", signUp);

router.get("/find", auth, findUsers);
router.get("/logout", auth, logOut);

router.delete("/notifications/:id", auth, deleteNotification);
router.delete("/", auth, deleteAccount);

router.put("/notifications", auth, toggleSeen);
router.put("/", auth, editProfile);
router.put("/change-password", auth, changePassword);

router.get("/notifications", auth, getNotifications);
router.get("/checkAuth", auth, checkAuth);
router.get("/data", auth, getData);

export default router;

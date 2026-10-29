import { Router } from "express";
import * as invitationController from "../controllers/invitation.controller.js";
import { requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

// Publiques : le jeton fait office d'autorisation
router.post("/verify", invitationController.verify);
router.post("/accept", invitationController.accept);

// Réservées au Super Administrateur
router.post("/", requireRole("SUPER_ADMIN"), invitationController.create);
router.get("/", requireRole("SUPER_ADMIN"), invitationController.list);
router.post("/:id/resend", requireRole("SUPER_ADMIN"), invitationController.resend);
router.post("/:id/revoke", requireRole("SUPER_ADMIN"), invitationController.revoke);

export default router;

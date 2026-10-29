import { Router } from "express";
import * as ticketController from "../controllers/ticket.controller.js";

const router = Router();

router.post("/", ticketController.create);
router.get("/", ticketController.list);
router.get("/:id", ticketController.getById);
router.patch("/:id/status", ticketController.updateStatus);

export default router;
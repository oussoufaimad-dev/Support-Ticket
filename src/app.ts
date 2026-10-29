import express from "express";
import ticketRoutes from "./routes/ticket.routes.js";
import { notFound } from "./middlewares/notFound.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/tickets", ticketRoutes);

// L'ordre compte : routes d'abord, puis 404, puis le gestionnaire d'erreurs
app.use(notFound);
app.use(errorHandler);

export default app;
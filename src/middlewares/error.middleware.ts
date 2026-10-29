import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/errors.js";

// Les 4 paramètres sont obligatoires : c'est ce qui dit à Express
// que c'est un middleware d'erreurs.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  // JSON mal formé envoyé par le client
  if (err instanceof SyntaxError && "status" in err && err.status === 400) {
    res.status(400).json({ error: "JSON invalide" });
    return;
  }

  // Erreur inattendue : on logge pour toi, on ne montre rien au client
  console.error(err);
  res.status(500).json({ error: "Erreur interne du serveur" });
}
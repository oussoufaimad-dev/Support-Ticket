import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/errors.js";
import type { Role } from "../generated/prisma/enums.js";

// Refuse par défaut : req.user sera renseigné par l'auth JWT (sections 3 et 4).
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new HttpError(401, "Authentification requise");
    if (!roles.includes(req.user.role)) throw new HttpError(403, "Accès interdit");
    next();
  };
}

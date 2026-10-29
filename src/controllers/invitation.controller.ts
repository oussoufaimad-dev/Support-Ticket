import type { Request, Response } from "express";
import * as invitationService from "../services/invitation.service.js";
import {
  parseUuid,
  validateAccept,
  validateCreateInvitation,
  validateToken,
} from "../validators/invitation.validator.js";

export async function create(req: Request, res: Response) {
  const input = validateCreateInvitation(req.body);
  const invitation = await invitationService.createInvitation(req.user!.id, input);
  res.status(201).json(invitation);
}

export async function list(_req: Request, res: Response) {
  res.status(200).json(await invitationService.listInvitations());
}

export async function resend(req: Request, res: Response) {
  const id = parseUuid(req.params.id);
  res.status(200).json(await invitationService.resendInvitation(id, req.user!.id));
}

export async function revoke(req: Request, res: Response) {
  const id = parseUuid(req.params.id);
  res.status(200).json(await invitationService.revokeInvitation(id));
}

export async function verify(req: Request, res: Response) {
  const token = validateToken(req.body);
  res.status(200).json(await invitationService.verifyInvitation(token));
}

export async function accept(req: Request, res: Response) {
  const { token, password } = validateAccept(req.body);
  await invitationService.acceptInvitation(token, password);
  res.status(200).json({ message: "Compte activé, vous pouvez vous connecter" });
}

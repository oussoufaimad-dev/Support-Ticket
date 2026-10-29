import { hash } from "@node-rs/argon2";
import { config } from "../config.js";
import { HttpError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { generateToken, hashToken } from "../lib/tokens.js";
import { sendInvitationEmail } from "./mail.service.js";
import type { Role } from "../generated/prisma/enums.js";

type InvitationStatus = "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";

type InvitationWithUser = {
  id: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  user: { id: string; email: string; name: string; role: Role };
};

const UNUSABLE_MESSAGES: Record<Exclude<InvitationStatus, "PENDING">, string> = {
  ACCEPTED: "Cette invitation a déjà été utilisée",
  REVOKED: "Cette invitation a été révoquée",
  EXPIRED: "Cette invitation a expiré",
};

function statusOf(inv: {
  acceptedAt: Date | null;
  revokedAt: Date | null;
  expiresAt: Date;
}): InvitationStatus {
  if (inv.acceptedAt) return "ACCEPTED";
  if (inv.revokedAt) return "REVOKED";
  if (inv.expiresAt <= new Date()) return "EXPIRED";
  return "PENDING";
}

// Jamais de tokenHash ni de passwordHash dans les réponses
function toPublic(inv: InvitationWithUser) {
  return {
    id: inv.id,
    userId: inv.user.id,
    email: inv.user.email,
    name: inv.user.name,
    role: inv.user.role,
    status: statusOf(inv),
    expiresAt: inv.expiresAt,
    createdAt: inv.createdAt,
  };
}

async function issueInvitation(
  user: { id: string; email: string; name: string },
  invitedById: string
) {
  const { token, tokenHash } = generateToken();
  const invitation = await prisma.invitation.create({
    data: {
      tokenHash,
      userId: user.id,
      invitedById,
      expiresAt: new Date(Date.now() + config.invitationTtlHours * 3_600_000),
    },
    include: { user: true },
  });

  await sendInvitationEmail({
    to: user.email,
    name: user.name,
    link: `${config.frontendUrl}/invitation/accept?token=${token}`,
    expiresInHours: config.invitationTtlHours,
  });

  return invitation;
}

export async function createInvitation(
  invitedById: string,
  input: { email: string; name: string; role: Role }
) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new HttpError(
      409,
      existing.status === "INVITED"
        ? "Une invitation existe déjà pour cette adresse : renvoyez-la"
        : "Un compte existe déjà pour cette adresse"
    );
  }

  const user = await prisma.user.create({ data: input });
  return toPublic(await issueInvitation(user, invitedById));
}

export async function listInvitations() {
  const items = await prisma.invitation.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
  return items.map(toPublic);
}

export async function resendInvitation(id: string, adminId: string) {
  const current = await prisma.invitation.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!current) throw new HttpError(404, "Invitation introuvable");
  if (current.acceptedAt || current.user.status !== "INVITED") {
    throw new HttpError(409, "Aucune invitation en attente pour cet utilisateur");
  }

  // Un seul lien valide à la fois : on révoque les anciens
  await prisma.invitation.updateMany({
    where: { userId: current.userId, acceptedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  return toPublic(await issueInvitation(current.user, adminId));
}

export async function revokeInvitation(id: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!invitation) throw new HttpError(404, "Invitation introuvable");
  if (invitation.acceptedAt) {
    throw new HttpError(409, "Cette invitation a déjà été utilisée");
  }
  if (invitation.revokedAt) return toPublic(invitation);

  const updated = await prisma.invitation.update({
    where: { id },
    data: { revokedAt: new Date() },
    include: { user: true },
  });
  return toPublic(updated);
}

async function findUsableInvitation(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!invitation) throw new HttpError(404, "Invitation invalide");

  const status = statusOf(invitation);
  if (status !== "PENDING") throw new HttpError(410, UNUSABLE_MESSAGES[status]);
  if (invitation.user.status !== "INVITED") {
    throw new HttpError(410, "Cette invitation n'est plus valide");
  }
  return invitation;
}

export async function verifyInvitation(token: string) {
  const invitation = await findUsableInvitation(token);
  return { email: invitation.user.email, name: invitation.user.name };
}

export async function acceptInvitation(token: string, password: string) {
  const invitation = await findUsableInvitation(token);
  const passwordHash = await hash(password); // Argon2id

  // Transaction : l'invitation est consommée une seule fois, même en cas de double clic
  await prisma.$transaction(async (tx) => {
    const now = new Date();

    const claimed = await tx.invitation.updateMany({
      where: {
        id: invitation.id,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: { acceptedAt: now },
    });
    if (claimed.count !== 1) {
      throw new HttpError(410, "Cette invitation n'est plus valide");
    }

    const activated = await tx.user.updateMany({
      where: { id: invitation.userId, status: "INVITED" },
      data: { passwordHash, status: "ACTIVE" },
    });
    if (activated.count !== 1) {
      throw new HttpError(410, "Cette invitation n'est plus valide");
    }
  });
}

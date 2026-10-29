import { HttpError } from "../lib/errors.js";

export const TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "CLOSED"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

const MAX_INT = 2147483647; // limite d'un Int PostgreSQL

export function parseId(value: unknown): number {
  if (
    typeof value !== "string" ||
    !/^[1-9]\d*$/.test(value) ||
    Number(value) > MAX_INT
  ) {
    throw new HttpError(400, "L'id doit être un entier positif");
  }
  return Number(value);
}

function requireObject(body: unknown): Record<string, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new HttpError(400, "Le body JSON est requis");
  }
  return body as Record<string, unknown>;
}

export function validateCreateTicket(body: unknown): {
  title: string;
  description: string;
} {
  const { title, description } = requireObject(body);

  if (typeof title !== "string" || title.trim() === "" || title.length > 200) {
    throw new HttpError(
      400,
      "Le champ 'title' est obligatoire (texte non vide, 200 caractères max)"
    );
  }
  if (typeof description !== "string" || description.trim() === "") {
    throw new HttpError(
      400,
      "Le champ 'description' est obligatoire (texte non vide)"
    );
  }

  return { title: title.trim(), description: description.trim() };
}

export function validateStatus(body: unknown): TicketStatus {
  const { status } = requireObject(body);

  if (!TICKET_STATUSES.includes(status as TicketStatus)) {
    throw new HttpError(
      400,
      "Le champ 'status' doit valoir OPEN, IN_PROGRESS ou CLOSED"
    );
  }
  return status as TicketStatus;
}
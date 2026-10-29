import { HttpError } from "../lib/errors.js";
import { Role } from "../generated/prisma/enums.js";

const ROLES = Object.values(Role) as Role[];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireObject(body: unknown): Record<string, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new HttpError(400, "Le body JSON est requis");
  }
  return body as Record<string, unknown>;
}

export function parseUuid(value: unknown): string {
  if (typeof value !== "string" || !UUID.test(value)) {
    throw new HttpError(400, "Identifiant invalide");
  }
  return value;
}

export function validateCreateInvitation(body: unknown): {
  email: string;
  name: string;
  role: Role;
} {
  const { email, name, role } = requireObject(body);

  if (typeof email !== "string" || email.length > 254 || !EMAIL.test(email.trim())) {
    throw new HttpError(400, "Le champ 'email' doit être une adresse e-mail valide");
  }
  if (typeof name !== "string" || name.trim() === "" || name.length > 100) {
    throw new HttpError(400, "Le champ 'name' est obligatoire (100 caractères max)");
  }
  if (!ROLES.includes(role as Role)) {
    throw new HttpError(400, `Le champ 'role' doit valoir ${ROLES.join(", ")}`);
  }

  return { email: email.trim().toLowerCase(), name: name.trim(), role: role as Role };
}

export function validateToken(body: unknown): string {
  const { token } = requireObject(body);
  if (typeof token !== "string" || token === "" || token.length > 200) {
    throw new HttpError(400, "Le champ 'token' est obligatoire");
  }
  return token;
}

export function validateAccept(body: unknown): { token: string; password: string } {
  const token = validateToken(body);
  const { password } = body as Record<string, unknown>;
  if (typeof password !== "string" || password.length < 12 || password.length > 128) {
    throw new HttpError(400, "Le mot de passe doit contenir entre 12 et 128 caractères");
  }
  return { token, password };
}

import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`);
  return value;
}

const ttl = Number(process.env.INVITATION_TTL_HOURS ?? 72);
if (!Number.isFinite(ttl) || ttl <= 0) {
  throw new Error("INVITATION_TTL_HOURS doit être un nombre positif");
}

export const config = {
  frontendUrl: required("FRONTEND_URL").replace(/\/$/, ""),
  resendApiKey: required("RESEND_API_KEY"),
  mailFrom: required("MAIL_FROM"),
  invitationTtlHours: ttl,
};

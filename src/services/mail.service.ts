import { Resend } from "resend";
import { config } from "../config.js";
import { HttpError } from "../lib/errors.js";

const resend = new Resend(config.resendApiKey);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendInvitationEmail(params: {
  to: string;
  name: string;
  link: string;
  expiresInHours: number;
}) {
  const name = escapeHtml(params.name);
  const html = `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f2;font-family:Arial,Helvetica,sans-serif;color:#222;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f2;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;padding:32px;">
        <tr><td>
          <h1 style="margin:0 0 16px;font-size:22px;">Bienvenue à la ressourcerie</h1>
          <p style="margin:0 0 16px;line-height:1.5;">Bonjour ${name},</p>
          <p style="margin:0 0 24px;line-height:1.5;">Un compte a été créé pour vous. Cliquez sur le bouton ci-dessous pour choisir votre mot de passe et activer votre compte.</p>
          <p style="margin:0 0 24px;"><a href="${params.link}" style="display:inline-block;background:#2f6f4e;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:bold;">Activer mon compte</a></p>
          <p style="margin:0 0 8px;font-size:14px;color:#555;">Ce lien est valable ${params.expiresInHours} heures et ne peut être utilisé qu'une seule fois.</p>
          <p style="margin:0;font-size:14px;color:#555;">Si vous n'attendiez pas cette invitation, ignorez simplement cet e-mail.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: config.mailFrom,
    to: params.to,
    subject: "Votre invitation à rejoindre la ressourcerie",
    html,
    text: `Bonjour ${params.name}, activez votre compte avec ce lien (valable ${params.expiresInHours} h, usage unique) : ${params.link}`,
  });

  if (error) {
    // On ne logge ni le lien ni le destinataire
    console.error("Échec d'envoi de l'e-mail d'invitation :", error.name, error.message);
    throw new HttpError(502, "Impossible d'envoyer l'e-mail d'invitation");
  }
}

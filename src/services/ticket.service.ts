import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/errors.js";
import type { TicketStatus } from "../validators/ticket.validator.js";

export async function createTicket(data: {
  title: string;
  description: string;
}) {
  return prisma.ticket.create({ data });
}

export async function listTickets() {
  return prisma.ticket.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getTicketById(id: number) {
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    throw new HttpError(404, "Ticket introuvable");
  }
  return ticket;
}

export async function updateTicketStatus(id: number, status: TicketStatus) {
  await getTicketById(id); // lance un 404 si le ticket n'existe pas
  return prisma.ticket.update({ where: { id }, data: { status } });
}
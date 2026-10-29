import type { Request, Response } from "express";
import * as ticketService from "../services/ticket.service.js";
import {
  parseId,
  validateCreateTicket,
  validateStatus,
} from "../validators/ticket.validator.js";

export async function create(req: Request, res: Response) {
  const data = validateCreateTicket(req.body);
  const ticket = await ticketService.createTicket(data);
  res.status(201).json(ticket);
}

export async function list(_req: Request, res: Response) {
  const tickets = await ticketService.listTickets();
  res.status(200).json(tickets);
}

export async function getById(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const ticket = await ticketService.getTicketById(id);
  res.status(200).json(ticket);
}

export async function updateStatus(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const status = validateStatus(req.body);
  const ticket = await ticketService.updateTicketStatus(id, status);
  res.status(200).json(ticket);
}
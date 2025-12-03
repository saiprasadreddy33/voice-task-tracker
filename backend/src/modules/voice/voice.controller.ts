import type { FastifyReply, FastifyRequest } from 'fastify';
import { createVoiceNoteSchema } from './voice.schemas.js';
import { createTaskFromVoiceNote, parseVoiceInput } from './voice.repository.js';

function getUserIdFromRequest(req: FastifyRequest): string | undefined {
  const header = req.headers['x-user-id'];
  const raw = Array.isArray(header) ? header[0] : header;
  if (!raw || typeof raw !== 'string') return undefined;
  const v = raw.trim();
  if (!v) return undefined;
  const low = v.toLowerCase();
  if (low === 'undefined' || low === 'null') return undefined;
  return v;
}

export async function postVoiceNote(req: FastifyRequest, reply: FastifyReply) {
  const parsed = createVoiceNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({ errors: parsed.error.flatten() });
  }

  const userId = getUserIdFromRequest(req);
  const result = await createTaskFromVoiceNote(parsed.data, userId);
  return reply.status(201).send(result);
}

export async function parseVoiceNote(req: FastifyRequest, reply: FastifyReply) {
  const parsed = createVoiceNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({ errors: parsed.error.flatten() });
  }
  const result = parseVoiceInput(parsed.data.transcript);
  return reply.send(result);
}

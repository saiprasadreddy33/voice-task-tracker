import type { FastifyReply, FastifyRequest } from 'fastify';
import { createTaskSchema, updateTaskSchema } from './task.schemas.js';
import * as taskRepo from './task.repository.js';
import { prisma } from '../../lib/prisma.js';

async function ensureUserExists(userId?: string) {
  if (!userId) return undefined;
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (existing) return existing;
  // create a lightweight placeholder user so tasks can be scoped per-browser
  return prisma.user.create({ data: { id: userId, email: `${userId}@local` } });
}

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

export async function getTasks(req: FastifyRequest, reply: FastifyReply) {
  const userId = getUserIdFromRequest(req);
  const tasks = await taskRepo.listTasks(userId);
  return reply.send(tasks);
}

export async function postTask(req: FastifyRequest, reply: FastifyReply) {
  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({ errors: parsed.error.flatten() });
  }

  const userId = getUserIdFromRequest(req);
  if (userId) {
    await ensureUserExists(userId);
  }

  const task = await taskRepo.createTask(parsed.data, userId);
  return reply.status(201).send(task);
}

export async function patchTask(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const parsed = updateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({ errors: parsed.error.flatten() });
  }

  const userId = getUserIdFromRequest(req);
  if (userId) await ensureUserExists(userId);

  const task = await taskRepo.updateTask(id, parsed.data, userId);
  return reply.send(task);
}

export async function deleteTask(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const userId = getUserIdFromRequest(req);
  if (userId) await ensureUserExists(userId);
  await taskRepo.deleteTask(id);
  return reply.status(204).send();
}

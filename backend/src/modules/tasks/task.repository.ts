import { prisma } from '../../lib/prisma.js';
import type { CreateTaskInput, UpdateTaskInput } from './task.schemas.js';

export async function listTasks(userId?: string) {
  return prisma.task.findMany({
    where: userId ? { userId } : undefined,
    orderBy: { createdAt: 'desc' },
  });
}

export async function createTask(data: CreateTaskInput, userId?: string) {
  const { dueDate, status, priority, ...rest } = data as any;
  const taskData: any = {
    ...rest,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    status: status ?? undefined,
    priority: priority ?? undefined,
  };
  if (userId) {
    taskData.userId = userId;
  }
  return prisma.task.create({
    data: taskData,
  });
}

export async function updateTask(id: string, data: UpdateTaskInput, userId?: string) {
  const { dueDate, status, priority, ...rest } = data as any;
  return prisma.task.update({
    where: userId ? { id, userId } : { id },
    data: {
      ...rest,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: status ?? undefined,
      priority: priority ?? undefined,
    },
  });
}

export async function deleteTask(id: string) {
  // Use deleteMany so we never throw if the record does not exist; this keeps
  // the API simple for the frontend and always returns 204.
  await prisma.task.deleteMany({
    where: { id },
  });
}

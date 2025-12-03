import type { FastifyInstance } from 'fastify';
import { getTasks, postTask, patchTask, deleteTask } from './task.controller.js';

export async function registerTaskRoutes(app: FastifyInstance) {
  app.get('/api/tasks', getTasks);
  app.post('/api/tasks', postTask);
  app.patch('/api/tasks/:id', patchTask);
  app.delete('/api/tasks/:id', deleteTask);
}

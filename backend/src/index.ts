import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma.js';
import { registerTaskRoutes } from './modules/tasks/task.routes.js';
import { registerVoiceRoutes } from './modules/voice/voice.routes.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 4000;

export async function buildServer() {
  const app = Fastify({
    logger: true,
  });

  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((v) => v.trim()).filter(Boolean)
    : true;

  await app.register(helmet);

  await app.register(cors, {
    origin: corsOrigin,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Ensure per-browser user exists and normalize header
  await app.register(import('./plugins/ensure-user.js'));

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, 'Unhandled error');
    const isProd = process.env.NODE_ENV === 'production';
    if (!reply.statusCode || reply.statusCode < 400) {
      reply.status(500);
    }
    void reply.send({
      error: {
        message: isProd ? 'Internal server error' : error.message,
      },
    });
  });

  app.setNotFoundHandler((request, reply) => {
    void reply.status(404).send({
      error: {
        message: 'Route not found',
        path: request.url,
      },
    });
  });

  app.get('/health', async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'up' };
    } catch {
      return { status: 'degraded', db: 'down' };
    }
  });

  await registerTaskRoutes(app);
  await registerVoiceRoutes(app);

  return app;
}

async function start() {
  try {
    const app = await buildServer();
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Backend listening on http://localhost:${PORT}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();

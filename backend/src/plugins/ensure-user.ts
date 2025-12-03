import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma.js';

const ensureUser: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', async (req, reply) => {
    try {
      const header = req.headers['x-user-id'];
      const raw = Array.isArray(header) ? header[0] : header;
      if (!raw || typeof raw !== 'string') return;
      const v = raw.trim();
      if (!v) return;
      const low = v.toLowerCase();
      if (low === 'null' || low === 'undefined') return;

      // upsert lightweight placeholder user
      await prisma.user.upsert({
        where: { id: v },
        update: {},
        create: { id: v, email: `${v}@local` },
      });

      // normalize header and expose userId on the request
      (req.headers as any)['x-user-id'] = v;
      (req as any).userId = v;
    } catch (err) {
      // don't block request on db failures; log and continue
      req.log.warn({ err }, 'ensure-user plugin failed');
    }
  });
};

export default fp(ensureUser, { name: 'ensure-user' });

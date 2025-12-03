import type { FastifyInstance } from 'fastify';
import { postVoiceNote, parseVoiceNote } from './voice.controller.js';

export async function registerVoiceRoutes(app: FastifyInstance) {
  app.post('/api/voice-notes', postVoiceNote);
  app.post('/api/voice-notes/parse', parseVoiceNote);
}

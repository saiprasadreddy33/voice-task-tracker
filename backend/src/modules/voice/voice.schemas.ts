import { z } from 'zod';

export const createVoiceNoteSchema = z.object({
  transcript: z.string().min(1, 'Transcript is required'),
  audioUrl: z.string().url().optional(),
});

export type CreateVoiceNoteInput = z.infer<typeof createVoiceNoteSchema>;

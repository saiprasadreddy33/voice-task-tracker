import { parse as chronoParse } from 'chrono-node';
import { prisma } from '../../lib/prisma.js';
import type { CreateVoiceNoteInput } from './voice.schemas.js';

export function deriveTitleFromTranscript(transcript: string): string {
  const trimmed = transcript.trim();
  if (!trimmed) return 'New task from voice note';
  const firstSentenceEnd = trimmed.search(/[.!?]/);
  if (firstSentenceEnd > 0) {
    return trimmed.slice(0, firstSentenceEnd + 1);
  }
  return trimmed.length > 80 ? `${trimmed.slice(0, 77)}...` : trimmed;
}

export async function createTaskFromVoiceNote(input: CreateVoiceNoteInput, userId?: string) {
  const title = deriveTitleFromTranscript(input.transcript);

  return prisma.$transaction(async (tx: typeof prisma) => {
    // ensure user exists if provided (create lightweight placeholder)
    if (userId) {
      await tx.user.upsert({
        where: { id: userId },
        update: {},
        create: { id: userId, email: `${userId}@local` },
      });
    }

    const voiceNote = await tx.voiceNote.create({
      data: {
        audioUrl: input.audioUrl,
        transcript: input.transcript,
      },
    });

    const task = await tx.task.create({
      data: {
        title,
        description: input.transcript,
        userId: userId ?? undefined,
        voiceNote: {
          connect: { id: voiceNote.id },
        },
      },
    });

    return { voiceNote, task };
  });
}

export function parseVoiceInput(transcript: string) {
  const result: {
    title: string;
    description: string;
    dueDate: string | null;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;
    status: 'PENDING' | 'IN_PROGRESS' | 'DONE';
    rawTranscript: string;
  } = {
    title: '',
    description: transcript,
    dueDate: null,
    priority: null,
    status: 'PENDING',
    rawTranscript: transcript,
  };

  // Priority extraction
  const priorityMap = [
    { regex: /\b(critical|urgent|high priority|asap)\b/i, value: 'HIGH' },
    { regex: /\b(low priority|low)\b/i, value: 'LOW' },
    { regex: /\b(medium priority|normal)\b/i, value: 'MEDIUM' },
  ];
  for (const { regex, value } of priorityMap) {
    if (regex.test(transcript)) {
      result.priority = value as any;
      break;
    }
  }
  if (!result.priority) result.priority = 'MEDIUM';

  // Status extraction
  if (/\b(done|completed|finish(ed)?)\b/i.test(transcript)) result.status = 'DONE';
  else if (/\b(in progress|doing|working)\b/i.test(transcript)) result.status = 'IN_PROGRESS';
  else result.status = 'PENDING';

  // Due date extraction
  const chronoResult = chronoParse(transcript);
  if (chronoResult.length > 0 && chronoResult[0].start) {
    result.dueDate = chronoResult[0].start.date().toISOString();
  }

  // Title extraction
  result.title = deriveTitleFromTranscript(transcript);

  return result;
}

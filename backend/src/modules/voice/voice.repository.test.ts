import { describe, it, expect } from 'vitest';
import { parseVoiceInput } from './voice.repository.js';

describe('parseVoiceInput (basic)', () => {
  it('parses priority and due date from sentence', () => {
    const transcript = "Remind me to send the project proposal to the client by next Wednesday, it's high priority";
    const result = parseVoiceInput(transcript);

    expect(result.title.toLowerCase()).toContain('remind');
    expect(result.priority).toBe('HIGH');
    expect(result.rawTranscript).toBe(transcript);
    expect(result.status).toBe('PENDING');
    expect(result.dueDate).toBeTruthy();
  });

  it('defaults priority to MEDIUM if not present', () => {
    const transcript = 'Update the README sometime next week';
    const result = parseVoiceInput(transcript);
    expect(result.priority).toBe('MEDIUM');
  });
});
import { describe, expect, it } from 'vitest';
import { deriveTitleFromTranscript, parseVoiceInput } from './voice.repository.js';

describe('deriveTitleFromTranscript', () => {
  it('returns default when empty', () => {
    expect(deriveTitleFromTranscript('  ')).toBe('New task from voice note');
  });

  it('uses first sentence when available', () => {
    const transcript = 'Call Alice about the project. Then send the report.';
    expect(deriveTitleFromTranscript(transcript)).toBe('Call Alice about the project.');
  });

  it('truncates long transcript', () => {
    const transcript = 'A'.repeat(200);
    const title = deriveTitleFromTranscript(transcript);
    expect(title.length).toBeLessThanOrEqual(80);
    expect(title.endsWith('...')).toBe(true);
  });
});

describe('parseVoiceInput (advanced)', () => {
  it('extracts priority and due date', () => {
    const transcript = 'Create a high priority task to review the PR by tomorrow evening';
    const result = parseVoiceInput(transcript);
    expect(result.priority).toBe('HIGH');
    expect(result.dueDate).not.toBeNull();
    expect(result.status).toBe('PENDING');
    expect(result.title).toContain('review the PR');
  });

  it('extracts low priority and status', () => {
    const transcript = 'Finish the documentation, low priority, done';
    const result = parseVoiceInput(transcript);
    expect(result.priority).toBe('LOW');
    expect(result.status).toBe('DONE');
  });

  it('defaults to medium priority and pending status', () => {
    const transcript = 'Remind me to send the report next week';
    const result = parseVoiceInput(transcript);
    expect(result.priority).toBe('MEDIUM');
    expect(result.status).toBe('PENDING');
  });

  it('detects CRITICAL priority separately from HIGH', () => {
    const transcript = 'Critical production issue in checkout flow, fix this now';
    const result = parseVoiceInput(transcript);
    expect(result.priority).toBe('CRITICAL');
    expect(result.status).toBe('PENDING');
  });

  it('understands status phrasing variations for in progress and done', () => {
    const t1 = parseVoiceInput('I am currently working on the onboarding flow, high priority');
    expect(t1.status).toBe('IN_PROGRESS');

    const t2 = parseVoiceInput('The migration was finished yesterday, low priority now');
    expect(t2.status).toBe('DONE');
  });

  it('parses due dates in phrases like "due by Friday", "by Friday", and "before Friday"', () => {
    const r1 = parseVoiceInput('Submit the expense report, high priority, due by Friday');
    const r2 = parseVoiceInput('Book the flights by Friday');
    const r3 = parseVoiceInput('Prepare the slides before Friday');

    expect(r1.dueDate).not.toBeNull();
    expect(r2.dueDate).not.toBeNull();
    expect(r3.dueDate).not.toBeNull();
  });
});

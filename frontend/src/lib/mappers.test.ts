import { describe, it, expect } from 'vitest';
import { parsedResponseToParsedTask, parsedTaskToCreatePayload } from './mappers';

describe('mappers', () => {
  it('converts parsed response to ParsedTask (HIGH)', () => {
    const parsed = { title: 'Buy milk', description: null, priority: 'HIGH', dueDate: '2025-12-10T00:00:00Z', status: 'DONE' };
    const transcript = 'Buy milk tomorrow';
    const p = parsedResponseToParsedTask(parsed, transcript);
    expect(p.title).toBe('Buy milk');
    expect(p.priority).toBe('high');
    expect(p.dueDate).toBe(parsed.dueDate);
    expect(p.status).toBe('done');
  });

  it('maps CRITICAL backend priority to critical in ParsedTask', () => {
    const parsed = { title: 'Outage', description: null, priority: 'CRITICAL', dueDate: null, status: 'PENDING' };
    const transcript = 'Critical production issue';
    const p = parsedResponseToParsedTask(parsed, transcript);
    expect(p.priority).toBe('critical');
  });

  it('converts ParsedTask to create payload', () => {
    const parsedTask = { title: 'Test', description: 'x', priority: 'low', dueDate: null, status: 'to_do' } as any;
    const payload = parsedTaskToCreatePayload(parsedTask);
    expect(payload.title).toBe('Test');
    expect(payload.priority).toBe('LOW');
    expect(payload.status).toBe('PENDING');
  });
});

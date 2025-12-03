import { describe, it, expect } from 'vitest';
import { mapTaskRowToTask } from './types';

describe('supabase types mapping', () => {
  it('maps a task row to UI Task shape', () => {
    const row = {
      id: 'abc123',
      title: 'Test Task',
      description: 'desc',
      status: 'to_do',
      priority: 'medium',
      due_date: '2025-12-05T00:00:00.000Z',
      created_at: '2025-12-01T12:00:00.000Z',
      updated_at: '2025-12-01T12:00:00.000Z',
    } as any;

    const task = mapTaskRowToTask(row);

    expect(task.id).toBe(row.id);
    expect(task.title).toBe(row.title);
    expect(task.description).toBe(row.description);
    expect(task.status).toBe('to_do');
    expect(task.priority).toBe('medium');
    expect(task.dueDate).toBe(row.due_date);
    expect(task.createdAt).toBe(row.created_at);
    expect(task.updatedAt).toBe(row.updated_at);
  });
});

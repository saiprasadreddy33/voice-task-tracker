import type { ParsedTask, Task } from '@/types/task';

// Convert backend parsed response into frontend ParsedTask
export function parsedResponseToParsedTask(parsed: any, voiceTranscript: string): ParsedTask {
  const backendPriority = (parsed.priority || 'MEDIUM').toLowerCase();
  let priority: ParsedTask['priority'];
  if (backendPriority === 'low') priority = 'low';
  else if (backendPriority === 'high') priority = 'high';
  else if (backendPriority === 'critical') priority = 'critical';
  else priority = 'medium';

  return {
    title: parsed.title || (voiceTranscript.split('.').slice(0, 1).join('') || voiceTranscript).trim(),
    description: parsed.description ?? null,
    priority,
    dueDate: parsed.dueDate || null,
    status: parsed.status === 'DONE' ? 'done' : parsed.status === 'IN_PROGRESS' ? 'in_progress' : 'to_do',
  };
}

// Convert frontend ParsedTask into backend create payload
export function parsedTaskToCreatePayload(confirmedTask: ParsedTask) {
  return {
    title: confirmedTask.title,
    description: confirmedTask.description || undefined,
    dueDate: confirmedTask.dueDate || undefined,
    priority: (confirmedTask.priority || 'medium').toUpperCase(),
    status: confirmedTask.status === 'in_progress' ? 'IN_PROGRESS' : confirmedTask.status === 'done' ? 'DONE' : 'PENDING',
  };
}

export function taskToCreatePayload(task: Partial<Task>) {
  return {
    title: task.title || 'Untitled',
    description: task.description || undefined,
    dueDate: (task.dueDate as any) || undefined,
    priority: ((task.priority || 'medium') as string).toUpperCase(),
    status: task.status === 'in_progress' ? 'IN_PROGRESS' : task.status === 'done' ? 'DONE' : 'PENDING',
  };
}

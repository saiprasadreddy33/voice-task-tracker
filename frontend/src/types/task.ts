export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'to_do' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedTask {
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string | null;
  status: 'to_do';
}

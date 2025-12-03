import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import { toast } from '@/hooks/use-toast';
import type { Task as UiTask } from '@/types/task'

export interface CreateTaskInput {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  dueDate?: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  dueDate?: string
}

export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const backend = await apiClient.get<any[]>('/api/tasks');
      // Map backend shape -> UI Task (camelCase, friendly enums)
      return backend.map((t) => ({
        id: String(t.id),
        title: t.title,
        description: t.description ?? null,
        status: t.status === 'PENDING' ? 'to_do' : t.status === 'IN_PROGRESS' ? 'in_progress' : 'done',
        priority: (t.priority || 'MEDIUM').toLowerCase() as UiTask['priority'],
        dueDate: t.dueDate ?? null,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      } as UiTask));
    },
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const maxAttempts = 2;
      let attempt = 0;
      const t = toast({ title: 'Saving', description: 'Creating task...', });

      while (attempt < maxAttempts) {
        attempt += 1;
        try {
          const res = await apiClient.post<Task>('/api/tasks', input);
          t.dismiss();
          return res;
        } catch (err: any) {
          if (attempt >= maxAttempts) {
            t.update({ title: 'Error', description: `Failed to create task: ${err?.message ?? err}`, variant: 'destructive' } as any);
            throw err;
          }
          t.update({ description: `Retrying... (attempt ${attempt + 0}/${maxAttempts})` } as any);
          // backoff
          await new Promise((r) => setTimeout(r, 500 * attempt));
        }
      }
      // should not reach here
      t.dismiss();
      throw new Error('Failed to create task');
    },
    retry: 0,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { id: string; data: UpdateTaskInput }) =>
      apiClient.patch<Task>(`/api/tasks/${payload.id}`, payload.data),
    // optimistic update for status changes so the card moves immediately
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueryData<any[]>(['tasks']);
      if (previous) {
        // Map backend-style enums in the payload to the UI-friendly shape
        const mappedData: any = { ...payload.data };
        if (payload.data.status) {
          mappedData.status =
            payload.data.status === 'IN_PROGRESS'
              ? 'in_progress'
              : payload.data.status === 'DONE'
              ? 'done'
              : 'to_do';
        }
        if (payload.data.priority) {
          mappedData.priority = (payload.data.priority || 'MEDIUM').toLowerCase();
        }

        queryClient.setQueryData(
          ['tasks'],
          previous.map((t) => (t.id === payload.id ? { ...t, ...mappedData } : t)),
        );
      }
      return { previous };
    },
    onError: (err, variables, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(['tasks'], context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/api/tasks/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

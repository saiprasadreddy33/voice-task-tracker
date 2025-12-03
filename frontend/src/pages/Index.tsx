import { useState, useMemo, useCallback, useEffect } from 'react';
import { Task, ParsedTask } from '@/types/task';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/api/tasks';
import { useParseVoiceNote } from '@/api/voice';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { TaskCard } from '@/components/TaskCard';
import { TaskDialog } from '@/components/TaskDialog';
import { VoiceInput } from '@/components/VoiceInput';
import { VoiceReviewDialog } from '@/components/VoiceReviewDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Loader2 } from 'lucide-react';
import { parsedResponseToParsedTask, parsedTaskToCreatePayload, taskToCreatePayload } from '@/lib/mappers';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Task['status'] | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Task['priority'] | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [voiceReviewOpen, setVoiceReviewOpen] = useState(false);
  const [parsedTask, setParsedTask] = useState<ParsedTask | null>(null);
  const [transcript, setTranscript] = useState('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isCreatingFromVoice, setIsCreatingFromVoice] = useState(false);
  const [savingIds, setSavingIds] = useState<string[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const { toast } = useToast();

  const { data: tasksData, isLoading } = useTasks();

  // Keep a local copy of tasks so drag-and-drop updates are instant,
  // independent of network latency.
  useEffect(() => {
    if (tasksData) {
      setTasks(tasksData as Task[]);
    }
  }, [tasksData]);

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const parseVoiceMutation = useParseVoiceNote();

  const handleVoiceTranscript = async (voiceTranscript: string) => {
    setIsProcessingVoice(true);
    setTranscript(voiceTranscript);
    try {
      const res = await parseVoiceMutation.mutateAsync({ transcript: voiceTranscript });
      const mapped = parsedResponseToParsedTask(res, voiceTranscript);
      setParsedTask(mapped);
      setVoiceReviewOpen(true);
      toast({ title: 'Voice Parsed', description: 'Review and edit the task details' });
    } catch (error: any) {
      console.error('Error parsing voice:', error);
      toast({ title: 'Error', description: 'Failed to parse voice input', variant: 'destructive' });
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const handleVoiceConfirm = async (confirmedTask: ParsedTask) => {
    // map frontend ParsedTask -> backend CreateTaskInput
    const payload: any = parsedTaskToCreatePayload(confirmedTask);

    try {
      setIsCreatingFromVoice(true);
        await createTaskMutation.mutateAsync(payload);
        toast({ title: 'Success', description: 'Task created successfully' });
        setVoiceReviewOpen(false);
        setParsedTask(null);
        setTranscript('');
    } catch (error: any) {
      const message = error?.message || (typeof error === 'string' ? error : 'Failed to create task');
      toast({ title: 'Error', description: message, variant: 'destructive' });
        setVoiceReviewOpen(false); // Ensure voice dialog state resets
    } finally {
      setIsCreatingFromVoice(false);
    }
  };

  const updateTask = useCallback(async (id: string, updates: Partial<any>) => {
    try {
      const payload: any = { ...updates };
      if (updates.status) {
        payload.status = updates.status === 'in_progress' ? 'IN_PROGRESS' : updates.status === 'done' ? 'DONE' : 'PENDING';
      }
      if (updates.priority) payload.priority = (updates.priority || 'medium').toUpperCase();
      if ((updates as any).dueDate) payload.dueDate = (updates as any).dueDate;
      await updateTaskMutation.mutateAsync({ id, data: payload });
      toast({ title: 'Success', description: 'Task updated successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
    }
  }, [updateTaskMutation, toast]);

  const deleteTask = useCallback(async (id: string) => {
    try {
      await deleteTaskMutation.mutateAsync(id);
      toast({ title: 'Success', description: 'Task deleted successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to delete task', variant: 'destructive' });
      throw error;
    }
  }, [deleteTaskMutation, toast]);

  const handleEdit = useCallback((t: Task) => {
    setEditingTask(t);
    setDialogOpen(true);
  }, []);

  const handleStatusChange = useCallback((id: string, newStatus: Task['status']) => {
    // Optimistic local update so the column changes immediately when using the menu
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
    // Start per-card/global loader right away
    setSavingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

    void (async () => {
      try {
        await updateTask(id, { status: newStatus });
      } finally {
        setSavingIds((prev) => prev.filter((sid) => sid !== id));
      }
    })();
  }, [updateTask]);

  const handleDeleteCallback = useCallback((id: string) => {
    return deleteTask(id);
  }, [deleteTask]);

  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (editingTask) {
      await updateTask(editingTask.id, taskData);
    } else {
      const payload = taskToCreatePayload(taskData);
      try {
        await createTaskMutation.mutateAsync(payload);
        toast({ title: 'Success', description: 'Task created successfully' });
      } catch (error: any) {
        const message = error?.message || (typeof error === 'string' ? error : 'Failed to create task');
        toast({ title: 'Error', description: message, variant: 'destructive' });
      }
    }
    setEditingTask(null);
  };

  // Normalize ids to strings for DnD, but otherwise just use local tasks state.
  const effectiveTasks = useMemo(() => {
    return tasks.map((task) => {
      const id = String(task.id);
      return {
        ...task,
        id,
      } as Task;
    });
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return effectiveTasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(q) || (task.description?.toLowerCase().includes(q) ?? false);
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [effectiveTasks, searchQuery, statusFilter, priorityFilter]);

  const tasksByStatus = useMemo(() => ({
    to_do: filteredTasks.filter((t) => t.status === 'to_do'),
    in_progress: filteredTasks.filter((t) => t.status === 'in_progress'),
    done: filteredTasks.filter((t) => t.status === 'done'),
  }), [filteredTasks]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId as 'to_do' | 'in_progress' | 'done';

    // 1) Instant local update so the card moves immediately
    setTasks((prev) =>
      prev.map((t) => (t.id === draggableId ? { ...t, status: newStatus } : t)),
    );

    // 2) Show saving indicator for this card immediately on drop
    setSavingIds((prev) => (prev.includes(draggableId) ? prev : [...prev, draggableId]));

    // 3) Save in the background using the existing updateTask helper (handles
    //    backend enum mapping + toasts). When it finishes (success or error),
    //    clear the saving indicator.
    try {
      await updateTask(draggableId, { status: newStatus });
    } finally {
      setSavingIds((prev) => prev.filter((id) => id !== draggableId));
    }
  };

  const columnTitles = {
    to_do: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      {/* Global saving indicator when any mutation is in-flight (visible during DnD save) */}
      {savingIds.length > 0 && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-card/95 border border-border/60 px-3 py-2 rounded-md shadow-lg backdrop-blur-md">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm">Saving changes…</span>
        </div>
      )}
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-radial from-primary/10 to-transparent blur-3xl animate-pulse-glow" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-radial from-accent/10 to-transparent blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="border-b border-border/30 backdrop-blur-xl bg-card/40 sticky top-0 z-10 shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6 animate-fade-in">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2 tracking-tight">Voice Task Tracker</h1>
              <p className="text-muted-foreground">Speak your tasks into existence ✨</p>
            </div>

            <div className="flex gap-3">
              <VoiceInput onTranscript={handleVoiceTranscript} isProcessing={isProcessingVoice || isCreatingFromVoice} />
              <Button onClick={() => { setEditingTask(null); setDialogOpen(true); }} size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Add Task
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap animate-slide-up">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-input/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-all"
              />
            </div>

            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-[150px] bg-input/50 backdrop-blur-sm border-border/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="to_do">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={(v: any) => setPriorityFilter(v)}>
              <SelectTrigger className="w-[150px] bg-input/50 backdrop-blur-sm border-border/50">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

            {/* Kanban Board */}
            <main className="relative container mx-auto px-4 py-8">
              {/* Overlay spinner shown while parsing + creating from voice */}
              {(isProcessingVoice || isCreatingFromVoice) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                  <div className="flex flex-col items-center gap-3 rounded-lg bg-card/95 border border-border/60 p-6 backdrop-blur-md">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <div className="text-sm text-foreground/90">Processing voice input…</div>
                  </div>
                </div>
              )}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(tasksByStatus).map(([status, statusTasks], idx) => (
            <Droppable droppableId={status} key={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-4 animate-fade-in ${snapshot.isDraggingOver ? 'ring-2 ring-primary/60 bg-primary/5' : ''}`}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="flex items-center justify-between backdrop-blur-sm bg-card/40 rounded-xl p-3 border border-border/30">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          status === 'to_do' ? 'bg-status-todo' :
                          status === 'in_progress' ? 'bg-status-progress' :
                          'bg-status-done'
                        }`} />
                        <h2 className="text-lg font-semibold text-foreground">
                          {columnTitles[status as Task['status']]}
                        </h2>
                      </div>
                      <span className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full backdrop-blur-sm">
                        {statusTasks.length}
                      </span>
                    </div>

                    <div className="space-y-3 min-h-[200px]">
                      {statusTasks.map((task, taskIdx) => (
                        <Draggable draggableId={String(task.id)} index={taskIdx} key={task.id}>
                          {(prov, snap) => (
                              <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              className={`${snap.isDragging ? 'scale-105 shadow-lg' : 'animate-slide-up'}`}
                              style={{ animationDelay: `${taskIdx * 0.05}s` }}
                            >
                              <TaskCard
                                task={task}
                                onEdit={handleEdit}
                                onDelete={handleDeleteCallback}
                                onStatusChange={handleStatusChange}
                                isSaving={savingIds.includes(String(task.id))}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}

                      {provided.placeholder}

                      {statusTasks.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground text-sm backdrop-blur-sm bg-card/20 rounded-xl border border-border/20 border-dashed">
                          <div className="opacity-50">No tasks yet</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </main>

      {/* Dialogs */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        onSave={handleSaveTask}
        isNew={!editingTask}
      />

      {parsedTask && (
        <VoiceReviewDialog
          open={voiceReviewOpen}
          onOpenChange={setVoiceReviewOpen}
          parsedTask={parsedTask}
          transcript={transcript}
          onConfirm={handleVoiceConfirm}
          onCancel={() => {
            setVoiceReviewOpen(false);
            setParsedTask(null);
            setTranscript('');
          }}
        />
      )}
    </div>
  );
};

export default Index;
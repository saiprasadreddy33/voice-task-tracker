import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Save, Loader2 } from 'lucide-react';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Partial<Task> | null;
  onSave: (task: Partial<Task>) => void;
  isNew: boolean;
}

export const TaskDialog = ({ open, onOpenChange, task, onSave, isNew }: TaskDialogProps) => {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'to_do',
    dueDate: null,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : null,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'to_do',
        dueDate: null,
      });
    }
  }, [task, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSave = {
      ...formData,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
    };

    try {
      setIsSaving(true);
      await onSave(dataToSave);
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to save task', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md backdrop-blur-xl bg-card/95 border-border/50 shadow-card-hover animate-modal-open">
        <DialogHeader>
            <DialogTitle className="text-2xl">
            {isNew ? 'Create New Task' : 'Edit Task'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/80">
            {isNew ? 'Fill in the details for your new task.' : 'Update the task details.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <Label htmlFor="title" className="text-sm font-semibold">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter task title"
              required
              className="bg-input/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-all"
            />
          </div>

          <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Label htmlFor="description" className="text-sm font-semibold">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add more details..."
              rows={3}
              className="bg-input/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <Label htmlFor="priority" className="text-sm font-semibold">
                Priority
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value: Task['priority']) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger id="priority" className="bg-input/50 backdrop-blur-sm border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-xl bg-card/95 border-border/50">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <Label htmlFor="status" className="text-sm font-semibold">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: Task['status']) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status" className="bg-input/50 backdrop-blur-sm border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-xl bg-card/95 border-border/50">
                  <SelectItem value="to_do">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <Label htmlFor="dueDate" className="text-sm font-semibold">
              Due Date
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={(formData.dueDate as string) || ''}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="bg-input/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-all"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isNew ? (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Task
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
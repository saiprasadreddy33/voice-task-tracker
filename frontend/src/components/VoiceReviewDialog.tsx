import { ParsedTask } from '@/types/task';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Sparkles, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

interface VoiceReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parsedTask: ParsedTask;
  transcript: string;
  onConfirm: (task: ParsedTask) => void;
  onCancel: () => void;
}

export const VoiceReviewDialog = ({
  open,
  onOpenChange,
  parsedTask,
  transcript,
  onConfirm,
  onCancel,
}: VoiceReviewDialogProps) => {
  const [editedTask, setEditedTask] = useState<ParsedTask>(parsedTask);

  // Sync editedTask when parsedTask changes (e.g., new recording)
  useEffect(() => {
    setEditedTask(parsedTask);
  }, [parsedTask]);

  const handleConfirm = () => {
    onConfirm(editedTask);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl backdrop-blur-xl bg-card/95 border-border/50 shadow-card-hover animate-modal-open">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-primary" />
            Review Voice Input
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/80">
            Review and edit the parsed task details before creating
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="relative p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border border-border/30 backdrop-blur-sm">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
              Your Voice Input
            </Label>
            <p className="text-sm mt-2 italic text-foreground/90 leading-relaxed">
              "{transcript}"
            </p>
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent animate-pulse" />
          </div>

          <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <Label htmlFor="voice-title" className="text-sm font-semibold">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="voice-title"
              value={editedTask.title}
              onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              className="bg-input/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-all"
            />
          </div>

          <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Label htmlFor="voice-description" className="text-sm font-semibold">
              Description
            </Label>
            <Textarea
              id="voice-description"
              value={editedTask.description || ''}
              onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
              rows={3}
              className="bg-input/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-all resize-none"
              placeholder="Add more details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <Label htmlFor="voice-priority" className="text-sm font-semibold">
                Priority
              </Label>
              <Select
                value={editedTask.priority}
                onValueChange={(value: ParsedTask['priority']) =>
                  setEditedTask({ ...editedTask, priority: value })
                }
              >
                <SelectTrigger id="voice-priority" className="bg-input/50 backdrop-blur-sm border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-xl bg-card/95 border-border/50">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <Label htmlFor="voice-due-date" className="text-sm font-semibold">
                Due Date
              </Label>
              <Input
                id="voice-dueDate"
                type="date"
                value={editedTask.dueDate ? new Date(editedTask.dueDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setEditedTask({
                  ...editedTask,
                  dueDate: e.target.value ? new Date(e.target.value).toISOString() : null
                })}
                className="bg-input/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              <Check className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
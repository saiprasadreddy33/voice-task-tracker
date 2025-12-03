import React, { memo, useState } from 'react';
import { Task } from '@/types/task';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar, MoreVertical, Pencil, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
  onStatusChange: (id: string, status: Task['status']) => void;
  isSaving?: boolean;
}

const priorityColors = {
  high: 'bg-priority-high text-white border-priority-high/50',
  medium: 'bg-priority-medium text-white border-priority-medium/50',
  low: 'bg-priority-low text-white border-priority-low/50',
  critical: 'bg-red-700 text-white border-red-700/50',
};

const statusLabels = {
  to_do: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

const TaskCardComponent = ({ task, onEdit, onDelete, onStatusChange, isSaving }: TaskCardProps) => {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(task.id);
      // Do NOT auto-close the dialog; user can close it manually (or via Cancel)
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <div className="relative group">
        {isSaving && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/20 rounded-xl">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {/* Glow effect on hover */}
        <div className="absolute -inset-0.5 bg-gradient-voice opacity-0 group-hover:opacity-30 rounded-xl blur transition-all duration-300" />

        <div className={`relative backdrop-blur-xl bg-gradient-card border border-border/50 rounded-xl p-4 shadow-card transition-all duration-300 ${isSaving ? 'opacity-70' : 'hover:shadow-card-hover hover:-translate-y-1 hover:border-primary/50'}`}>
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-bold text-foreground text-base flex-1 mr-2 line-clamp-2 leading-tight">
              {task.title}
            </h3>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/20"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="backdrop-blur-xl bg-card/95 border-border/50">
                <DropdownMenuItem onClick={() => onEdit(task)} className="cursor-pointer">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onStatusChange(task.id, 'to_do')}
                  disabled={task.status === 'to_do'}
                  className="cursor-pointer"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Move to To Do
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onStatusChange(task.id, 'in_progress')}
                  disabled={task.status === 'in_progress'}
                  className="cursor-pointer"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Move to In Progress
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onStatusChange(task.id, 'done')}
                  disabled={task.status === 'done'}
                  className="cursor-pointer"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Move to Done
                </DropdownMenuItem>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {task.description && (
            <p className="text-sm text-muted-foreground/80 mb-3 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between flex-wrap gap-2">
            <Badge className={`${priorityColors[task.priority]} border shadow-sm font-medium`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Badge>

            {task.dueDate && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md backdrop-blur-sm">
                <Calendar className="h-3 w-3" />
                {format(new Date(task.dueDate), 'MMM dd, yyyy')}
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete task</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete
            {' '}
            <span className="font-semibold text-foreground">"{task.title}"</span>
            ? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="mt-4 flex justify-end gap-2">
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export const TaskCard = memo(TaskCardComponent);
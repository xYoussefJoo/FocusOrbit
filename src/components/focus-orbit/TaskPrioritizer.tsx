import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const tasks = [
  { id: 1, title: 'Implement Authentication API', priority: 'high', done: true },
  { id: 2, title: 'Design Database Schema', priority: 'high', done: true },
  { id: 3, title: 'Configure Domain & SSL', priority: 'medium', done: false },
  { id: 4, title: 'Write Integration Tests', priority: 'low', done: false },
];

export function TaskPrioritizer() {
  return (
    <div className="w-full h-full flex flex-col p-4 bg-surface/30 rounded-xl space-y-3">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface hover:bg-surface-high transition-colors shadow-sm">
          {task.done ? (
            <CheckCircle2 className="w-5 h-5 text-primary-container shrink-0" />
          ) : (
            <Circle className="w-5 h-5 text-surface-high shrink-0" />
          )}
          <span className={cn(
            "text-sm font-medium flex-1 truncate",
            task.done ? "text-on-surface-variant line-through opacity-70" : "text-white"
          )}>
            {task.title}
          </span>
          {!task.done && (
            <div className={cn(
              "w-2 h-2 rounded-full shrink-0",
              task.priority === 'high' ? "bg-red-400" :
              task.priority === 'medium' ? "bg-amber-400" : "bg-primary-container"
            )} />
          )}
        </div>
      ))}
    </div>
  );
}

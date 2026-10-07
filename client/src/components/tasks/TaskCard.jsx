import React from 'react';
import { Calendar, Clock, Pencil, Trash2, ArrowRight, RotateCcw } from 'lucide-react';
import Badge from '../ui/Badge';
import { formatDate, formatRelativeTime, getStatusColor, getPriorityColor, getStatusLabel, getPriorityLabel } from '../../utils/formatters';

const priorityAccents = {
  HIGH: 'border-l-danger-500',
  MEDIUM: 'border-l-warning-400',
  LOW: 'border-l-success-400',
};

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const accent = priorityAccents[task.priority] || 'border-l-gray-200';

  const getNextStatusAction = () => {
    switch (task.status) {
      case 'TODO': return { label: 'Start', next: 'IN_PROGRESS', icon: ArrowRight };
      case 'IN_PROGRESS': return { label: 'Complete', next: 'COMPLETED', icon: ArrowRight };
      case 'COMPLETED': return { label: 'Reopen', next: 'TODO', icon: RotateCcw };
      default: return null;
    }
  };

  const nextAction = getNextStatusAction();

  return (
    <div className={`card border-l-[3px] ${accent} h-full flex flex-col group transition-all duration-200 hover:shadow-card`}>
      <div className="p-4 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          {/* VULNERABILITY: Stored XSS — renders task title as raw HTML */}
          <h3
            className="text-sm font-semibold text-gray-900 line-clamp-1 flex-1"
            dangerouslySetInnerHTML={{ __html: task.title }}
          />
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity -mt-0.5 -mr-1">
            <button
              onClick={onEdit}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-md text-gray-400 hover:text-danger-600 hover:bg-danger-50 transition-colors"
              aria-label="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* VULNERABILITY: Stored XSS — renders task description as raw HTML */}
        <div
          className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed flex-1"
          dangerouslySetInnerHTML={{ __html: task.description || '<span class="text-gray-300 italic">No description</span>' }}
        />

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <Badge variant={getStatusColor(task.status)} size="sm">
            {getStatusLabel(task.status)}
          </Badge>
          <Badge variant={getPriorityColor(task.priority)} size="sm">
            {getPriorityLabel(task.priority)}
          </Badge>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100/80 flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          {task.dueDate && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="w-3 h-3 text-gray-400" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{formatRelativeTime(task.createdAt)}</span>
          </div>
        </div>

        {nextAction && (
          <button
            onClick={() => onStatusChange(nextAction.next)}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            {nextAction.label}
            <nextAction.icon className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { Calendar, Clock, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatDate, formatRelativeTime, getStatusColor, getPriorityColor, getStatusLabel, getPriorityLabel } from '../../utils/formatters';

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const priorityBorderColors = {
    HIGH: 'border-l-red-500',
    MEDIUM: 'border-l-amber-500',
    LOW: 'border-l-emerald-500'
  };

  const borderColor = priorityBorderColors[task.priority] || 'border-l-gray-300';

  const getNextStatusAction = () => {
    switch(task.status) {
      case 'TODO': return { label: 'Start', next: 'IN_PROGRESS' };
      case 'IN_PROGRESS': return { label: 'Complete', next: 'COMPLETED' };
      case 'COMPLETED': return { label: 'Reopen', next: 'TODO' };
      default: return null;
    }
  };

  const nextAction = getNextStatusAction();

  return (
    <Card className={`border-l-4 ${borderColor} hover:shadow-md transition-all duration-200 h-full flex flex-col group`} padding="md">
      <div className="flex justify-between items-start mb-2 gap-2">
        <h3 className="font-semibold text-gray-900 truncate flex-1" title={task.title}>{task.title}</h3>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center -mt-1 -mr-1">
          <Button variant="ghost" size="sm" icon={Pencil} onClick={onEdit} className="p-1 h-8 w-8 text-gray-500" aria-label="Edit" />
          <Button variant="ghost" size="sm" icon={Trash2} onClick={onDelete} className="p-1 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" aria-label="Delete" />
        </div>
      </div>
      
      <p className="text-gray-600 text-sm line-clamp-2 mb-4 flex-1">
        {task.description || <span className="text-gray-400 italic">No description</span>}
      </p>
      
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge variant={getStatusColor(task.status)} size="sm">{getStatusLabel(task.status)}</Badge>
        <Badge variant={getPriorityColor(task.priority)} size="sm">{getPriorityLabel(task.priority)}</Badge>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
        <div className="flex flex-col gap-1 text-xs text-gray-500">
          {task.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{formatRelativeTime(task.createdAt)}</span>
          </div>
        </div>
        
        {nextAction && (
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => onStatusChange(nextAction.next)}
            className="text-xs py-1 h-7"
          >
            {nextAction.label}
          </Button>
        )}
      </div>
    </Card>
  );
}

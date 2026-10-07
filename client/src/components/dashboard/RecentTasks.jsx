import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Badge from '../ui/Badge';
import LoadingSkeleton from '../ui/LoadingSkeleton';
import { formatRelativeTime, getStatusColor, getPriorityColor, getStatusLabel, getPriorityLabel } from '../../utils/formatters';

export default function RecentTasks({ tasks = [], loading }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h3 className="text-[15px] font-semibold text-gray-900">Recent Activity</h3>
        <Link
          to="/tasks"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          View all
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="px-5 pb-5 space-y-2">
          <LoadingSkeleton type="row" count={3} />
        </div>
      ) : tasks.length === 0 ? (
        <div className="px-5 pb-8 pt-4 text-center">
          <p className="text-sm text-gray-400">No tasks yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="pb-1">
          {tasks.map((task, i) => (
            <div
              key={task.id}
              className={`flex items-center gap-4 px-5 py-3 hover:bg-gray-50/70 transition-colors ${
                i !== tasks.length - 1 ? 'border-b border-gray-100/80' : ''
              }`}
            >
              {/* Priority dot */}
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                task.priority?.toLowerCase() === 'high' ? 'bg-danger-500' :
                task.priority?.toLowerCase() === 'medium' ? 'bg-warning-500' :
                'bg-success-500'
              }`} />

              {/* Task info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatRelativeTime(task.updatedAt || task.createdAt)}
                </p>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant={getStatusColor(task.status)} size="sm">
                  {getStatusLabel(task.status)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

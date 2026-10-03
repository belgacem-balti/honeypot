import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import LoadingSkeleton from '../ui/LoadingSkeleton';
import { formatRelativeTime, getStatusColor, getPriorityColor, getStatusLabel, getPriorityLabel } from '../../utils/formatters';

export default function RecentTasks({ tasks = [], loading }) {
  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Recent Tasks</h3>
        <Link to="/tasks" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          View All
        </Link>
      </div>

      {loading ? (
        <LoadingSkeleton type="row" count={3} />
      ) : tasks.length === 0 ? (
        <div className="text-center py-6 text-gray-500 text-sm">
          No recent tasks found.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {tasks.map(task => (
            <div key={task.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-50 transition-colors -mx-4 px-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                <p className="text-xs text-gray-500 mt-1">Updated {formatRelativeTime(task.updatedAt || task.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getPriorityColor(task.priority)} size="sm">
                  {getPriorityLabel(task.priority)}
                </Badge>
                <Badge variant={getStatusColor(task.status)} size="sm">
                  {getStatusLabel(task.status)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

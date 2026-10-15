import React from 'react';
import { CalendarDays, AlertTriangle } from 'lucide-react';
import LoadingSkeleton from '../ui/LoadingSkeleton';

function getDaysUntil(dateStr) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / 86400000);
}

export default function UpcomingDeadlines({ tasks = [], loading }) {
  const upcoming = tasks
    .filter((t) => t.dueDate && t.status !== 'COMPLETED')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h3 className="text-[15px] font-semibold text-gray-900">Upcoming Deadlines</h3>
        <CalendarDays className="w-4 h-4 text-gray-400" />
      </div>

      {loading ? (
        <div className="px-5 pb-5 space-y-2">
          <LoadingSkeleton type="row" count={3} />
        </div>
      ) : upcoming.length === 0 ? (
        <div className="px-5 pb-8 pt-4 text-center">
          <p className="text-sm text-gray-400">No upcoming deadlines</p>
        </div>
      ) : (
        <div className="pb-1">
          {upcoming.map((task, i) => {
            const days = getDaysUntil(task.dueDate);
            const isOverdue = days < 0;
            const isUrgent = days >= 0 && days <= 2;

            return (
              <div
                key={task.id}
                className={`flex items-center gap-4 px-5 py-3 hover:bg-gray-50/70 transition-colors ${
                  i !== upcoming.length - 1 ? 'border-b border-gray-100/80' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isOverdue ? 'bg-danger-50' : isUrgent ? 'bg-warning-50' : 'bg-gray-50'
                }`}>
                  {isOverdue ? (
                    <AlertTriangle className="w-4 h-4 text-danger-500" />
                  ) : (
                    <span className={`text-xs font-bold ${isUrgent ? 'text-warning-600' : 'text-gray-500'}`}>
                      {new Date(task.dueDate).getDate()}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                  <p className={`text-xs mt-0.5 ${
                    isOverdue ? 'text-danger-500 font-medium' : isUrgent ? 'text-warning-500' : 'text-gray-400'
                  }`}>
                    {isOverdue
                      ? `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} overdue`
                      : days === 0
                        ? 'Due today'
                        : days === 1
                          ? 'Due tomorrow'
                          : `${days} days left`
                    }
                  </p>
                </div>

                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  task.priority === 'HIGH' ? 'bg-danger-500' :
                  task.priority === 'MEDIUM' ? 'bg-warning-500' : 'bg-success-500'
                }`} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

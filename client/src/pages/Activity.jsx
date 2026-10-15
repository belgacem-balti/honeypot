import React, { useState } from 'react';
import { CheckCircle2, Plus, Edit3, Trash2, ArrowUpCircle, Clock, Filter, Activity as ActivityIcon } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';

const activityTypes = {
  created: { icon: Plus, color: 'bg-success-500', label: 'Created' },
  updated: { icon: Edit3, color: 'bg-primary-500', label: 'Updated' },
  completed: { icon: CheckCircle2, color: 'bg-success-600', label: 'Completed' },
  status_changed: { icon: ArrowUpCircle, color: 'bg-warning-500', label: 'Status Changed' },
  deleted: { icon: Trash2, color: 'bg-danger-500', label: 'Deleted' },
};

function generateActivities(tasks) {
  const activities = [];

  tasks.forEach((task) => {
    // Created
    activities.push({
      id: `${task.id}-created`,
      type: 'created',
      task,
      timestamp: task.createdAt,
      description: `Created task "${task.title}"`,
    });

    // Updated (if different from created)
    if (task.updatedAt && task.updatedAt !== task.createdAt) {
      if (task.status === 'COMPLETED') {
        activities.push({
          id: `${task.id}-completed`,
          type: 'completed',
          task,
          timestamp: task.updatedAt,
          description: `Completed task "${task.title}"`,
        });
      } else {
        activities.push({
          id: `${task.id}-updated`,
          type: 'updated',
          task,
          timestamp: task.updatedAt,
          description: `Updated task "${task.title}"`,
        });
      }
    }
  });

  return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function formatTimestamp(ts) {
  const date = new Date(ts);
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function groupByDate(activities) {
  const groups = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  activities.forEach((a) => {
    const date = new Date(a.timestamp);
    date.setHours(0, 0, 0, 0);
    let key;
    if (date.getTime() === today.getTime()) key = 'Today';
    else if (date.getTime() === yesterday.getTime()) key = 'Yesterday';
    else key = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  });

  return groups;
}

export default function Activity() {
  const { tasks, loading } = useTasks();
  const [filterType, setFilterType] = useState('all');

  const allActivities = generateActivities(tasks);
  const filteredActivities = filterType === 'all' ? allActivities : allActivities.filter((a) => a.type === filterType);
  const grouped = groupByDate(filteredActivities);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Activity</h1>
          <p className="text-sm text-gray-500 mt-1">Track all changes and updates across your tasks</p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Events', value: allActivities.length, color: 'text-gray-900' },
          { label: 'Created', value: allActivities.filter((a) => a.type === 'created').length, color: 'text-success-600' },
          { label: 'Completed', value: allActivities.filter((a) => a.type === 'completed').length, color: 'text-primary-600' },
          { label: 'Updated', value: allActivities.filter((a) => a.type === 'updated').length, color: 'text-warning-600' },
        ].map((stat) => (
          <div key={stat.label} className="card p-4">
            <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            <p className={`text-xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: 'all', label: 'All' },
          { key: 'created', label: 'Created' },
          { key: 'updated', label: 'Updated' },
          { key: 'completed', label: 'Completed' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterType(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
              ${filterType === f.key
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Activity timeline */}
      <div className="space-y-8">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 skeleton rounded" />
                    <div className="h-3 w-1/3 skeleton rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <ActivityIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No activity yet</h3>
            <p className="text-sm text-gray-500">Activities will appear here as you create and manage tasks</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 pl-1">{date}</h3>
              <div className="space-y-1">
                {items.map((activity) => {
                  const config = activityTypes[activity.type] || activityTypes.updated;
                  const Icon = config.icon;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 p-4 rounded-xl hover:bg-white hover:shadow-soft transition-all duration-200 group"
                    >
                      <div className={`w-9 h-9 rounded-xl ${config.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 font-medium">{activity.description}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(activity.timestamp)}
                          </span>
                          {activity.task?.priority && (
                            <>
                              <span className="text-gray-200">·</span>
                              <span className={`text-xs capitalize ${
                                activity.task.priority === 'HIGH' ? 'text-danger-500' :
                                activity.task.priority === 'MEDIUM' ? 'text-warning-500' : 'text-success-500'
                              }`}>
                                {activity.task.priority.toLowerCase()} priority
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

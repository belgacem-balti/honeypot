import React from 'react';
import { ClipboardList, CheckCircle2, Clock, Circle } from 'lucide-react';
import LoadingSkeleton from '../ui/LoadingSkeleton';

const cards = [
  {
    key: 'total',
    title: 'Total Tasks',
    icon: ClipboardList,
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
    valueColor: 'text-gray-900',
  },
  {
    key: 'completed',
    title: 'Completed',
    icon: CheckCircle2,
    iconBg: 'bg-success-50',
    iconColor: 'text-success-600',
    valueColor: 'text-success-700',
  },
  {
    key: 'inProgress',
    title: 'In Progress',
    icon: Clock,
    iconBg: 'bg-warning-50',
    iconColor: 'text-warning-600',
    valueColor: 'text-warning-700',
  },
  {
    key: 'todo',
    title: 'To Do',
    icon: Circle,
    iconBg: 'bg-primary-50',
    iconColor: 'text-primary-600',
    valueColor: 'text-primary-700',
  },
];

export default function StatsCards({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <LoadingSkeleton type="stat" count={4} />
      </div>
    );
  }

  const safeStats = stats || { total: 0, completed: 0, inProgress: 0, todo: 0 };
  const total = safeStats.total || 1; // avoid division by zero

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ key, title, icon: Icon, iconBg, iconColor, valueColor }) => {
        const value = safeStats[key] || 0;
        const pct = key === 'total' ? null : Math.round((value / total) * 100);

        return (
          <div key={key} className="card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</span>
              <div className={`w-8 h-8 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <p className={`text-2xl sm:text-3xl font-bold ${valueColor} tracking-tight`}>{value}</p>
            {pct !== null && (
              <p className="text-xs text-gray-400 mt-1">{pct}% of total</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

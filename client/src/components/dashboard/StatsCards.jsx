import React from 'react';
import { ClipboardList, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import Card from './../ui/Card';
import LoadingSkeleton from './../ui/LoadingSkeleton';

export default function StatsCards({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <LoadingSkeleton type="stat" count={4} />
      </div>
    );
  }

  const safeStats = stats || { total: 0, completed: 0, inProgress: 0, todo: 0 };

  const cards = [
    {
      title: 'Total Tasks',
      value: safeStats.total,
      icon: <ClipboardList size={24} />,
      bg: 'bg-blue-100',
      color: 'text-blue-600',
      label: 'Total tracked'
    },
    {
      title: 'Completed',
      value: safeStats.completed,
      icon: <CheckCircle2 size={24} />,
      bg: 'bg-green-100',
      color: 'text-green-600',
      label: 'Tasks done'
    },
    {
      title: 'In Progress',
      value: safeStats.inProgress,
      icon: <Clock size={24} />,
      bg: 'bg-amber-100',
      color: 'text-amber-600',
      label: 'Actively working'
    },
    {
      title: 'To Do',
      value: safeStats.todo,
      icon: <AlertCircle size={24} />,
      bg: 'bg-purple-100',
      color: 'text-purple-600',
      label: 'Pending tasks'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, idx) => (
        <Card key={idx} padding="md" className="flex items-center p-6">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-600 mb-1">{card.title}</h3>
            <div className="text-3xl font-bold text-gray-900 mb-1">{card.value}</div>
            <p className="text-xs text-gray-500">{card.label}</p>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${card.bg} ${card.color}`}>
            {card.icon}
          </div>
        </Card>
      ))}
    </div>
  );
}

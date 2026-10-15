import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function ProductivityScore({ stats }) {
  const total = stats.total || 1;
  const score = Math.round(((stats.completed || 0) / total) * 100);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  const trend = score >= 70 ? 'up' : score >= 40 ? 'neutral' : 'down';
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-success-500' : trend === 'down' ? 'text-danger-500' : 'text-warning-500';
  const trendLabel = trend === 'up' ? 'Great work!' : trend === 'down' ? 'Needs attention' : 'Keep going';

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-gray-900">Productivity</h3>
        <div className={`flex items-center gap-1 ${trendColor}`}>
          <TrendIcon className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{trendLabel}</span>
        </div>
      </div>

      <div className="flex items-center justify-center py-2">
        <div className="relative">
          <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
            <circle cx="64" cy="64" r="54" fill="none" stroke="#f3f4f6" strokeWidth="8" />
            <circle
              cx="64" cy="64" r="54" fill="none"
              stroke="url(#scoreGrad)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out-expo"
            />
            <defs>
              <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-gray-900 tracking-tight">{score}%</span>
            <span className="text-xxs text-gray-400 font-medium mt-0.5">completion</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        {[
          { label: 'Done', value: stats.completed || 0, color: 'text-success-600' },
          { label: 'Active', value: stats.inProgress || 0, color: 'text-primary-600' },
          { label: 'Todo', value: stats.todo || 0, color: 'text-gray-500' },
        ].map((item) => (
          <div key={item.label} className="text-center p-2 rounded-xl bg-gray-50">
            <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
            <p className="text-xxs text-gray-400 font-medium">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

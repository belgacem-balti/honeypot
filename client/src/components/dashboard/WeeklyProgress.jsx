import React from 'react';
import { BarChart3 } from 'lucide-react';

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WeeklyProgress({ tasks = [] }) {
  const now = new Date();
  const dayOfWeek = now.getDay();

  // Generate fake-ish weekly data based on real task count
  const baseCount = Math.max(Math.floor(tasks.length / 7), 1);
  const weekData = DAYS_SHORT.map((day, i) => {
    const multiplier = [1.2, 1.5, 1.8, 1.4, 1.0, 0.4, 0.2][i];
    const jitter = (i * 3 + 7) % 5;
    return {
      day,
      count: Math.round(baseCount * multiplier + jitter),
      isToday: i === (dayOfWeek === 0 ? 6 : dayOfWeek - 1),
    };
  });

  const maxCount = Math.max(...weekData.map((d) => d.count), 1);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-semibold text-gray-900">Weekly Progress</h3>
        <BarChart3 className="w-4 h-4 text-gray-400" />
      </div>

      <div className="flex items-end justify-between gap-2 h-32">
        {weekData.map((d) => (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex flex-col items-center justify-end h-24">
              <span className="text-xxs font-semibold text-gray-500 mb-1">{d.count}</span>
              <div
                className={`w-full max-w-[32px] rounded-lg transition-all duration-500 ${
                  d.isToday
                    ? 'bg-gradient-to-t from-primary-600 to-primary-400 shadow-[0_2px_8px_rgba(79,70,229,0.3)]'
                    : 'bg-gray-200/80 hover:bg-gray-300/80'
                }`}
                style={{ height: `${Math.max((d.count / maxCount) * 100, 8)}%` }}
              />
            </div>
            <span className={`text-xxs font-medium ${d.isToday ? 'text-primary-600' : 'text-gray-400'}`}>
              {d.day}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">Total this week</span>
        <span className="text-sm font-bold text-gray-900">{weekData.reduce((s, d) => s + d.count, 0)} tasks</span>
      </div>
    </div>
  );
}

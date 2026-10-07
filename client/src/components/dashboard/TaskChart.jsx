import React from 'react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

const STATUS_COLORS = ['#6366f1', '#f59e0b', '#10b981'];
const PRIORITY_COLORS = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' };

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
      <span className="font-medium">{payload[0].name || payload[0].payload.name}</span>
      <span className="text-gray-400 ml-2">{payload[0].value}</span>
    </div>
  );
};

export default function TaskChart({ tasks = [], stats = {} }) {
  const pieData = [
    { name: 'To Do', value: stats.todo || 0 },
    { name: 'In Progress', value: stats.inProgress || 0 },
    { name: 'Completed', value: stats.completed || 0 },
  ].filter(d => d.value > 0);

  const priorityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  tasks.forEach(t => {
    if (priorityCounts[t.priority] !== undefined) priorityCounts[t.priority]++;
  });

  const barData = [
    { name: 'Low', count: priorityCounts.LOW },
    { name: 'Medium', count: priorityCounts.MEDIUM },
    { name: 'High', count: priorityCounts.HIGH },
  ];

  const hasPieData = pieData.length > 0;
  const hasBarData = tasks.length > 0;

  return (
    <>
      {/* Status donut */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-gray-900">Status Overview</h3>
        </div>

        <div className="h-[220px]">
          {hasPieData ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-gray-400">
              No tasks yet
            </div>
          )}
        </div>

        {/* Legend */}
        {hasPieData && (
          <div className="flex items-center justify-center gap-5 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[i] }} />
                <span className="text-xs text-gray-500">{d.name}</span>
                <span className="text-xs font-semibold text-gray-700">{d.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Priority bar chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-gray-900">By Priority</h3>
        </div>

        <div className="h-[220px]">
          {hasBarData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                  {barData.map((entry) => (
                    <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-gray-400">
              No tasks yet
            </div>
          )}
        </div>
      </div>
    </>
  );
}

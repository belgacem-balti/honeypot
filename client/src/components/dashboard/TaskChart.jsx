import React from 'react';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import Card from '../ui/Card';

export default function TaskChart({ tasks = [], stats = {} }) {
  const pieData = [
    { name: 'To Do', value: stats.todo || 0, fill: '#8b5cf6' },
    { name: 'In Progress', value: stats.inProgress || 0, fill: '#f59e0b' },
    { name: 'Completed', value: stats.completed || 0, fill: '#10b981' }
  ].filter(d => d.value > 0);

  const priorityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  tasks.forEach(t => {
    if (priorityCounts[t.priority] !== undefined) {
      priorityCounts[t.priority]++;
    }
  });

  const barData = [
    { name: 'Low', count: priorityCounts.LOW, fill: '#10b981' },
    { name: 'Medium', count: priorityCounts.MEDIUM, fill: '#f59e0b' },
    { name: 'High', count: priorityCounts.HIGH, fill: '#ef4444' }
  ];

  const hasPieData = pieData.length > 0;
  const hasBarData = tasks.length > 0;

  return (
    <>
      <Card padding="md" className="flex flex-col h-full">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Tasks by Status</h3>
        <div className="flex-1 h-[250px] w-full min-h-[250px]">
          {hasPieData ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">No data to display</div>
          )}
        </div>
      </Card>

      <Card padding="md" className="flex flex-col h-full">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Tasks by Priority</h3>
        <div className="flex-1 h-[250px] w-full min-h-[250px]">
          {hasBarData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">No data to display</div>
          )}
        </div>
      </Card>
    </>
  );
}

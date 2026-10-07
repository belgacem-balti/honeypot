import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import Button from '../components/ui/Button';
import StatsCards from '../components/dashboard/StatsCards';
import TaskChart from '../components/dashboard/TaskChart';
import RecentTasks from '../components/dashboard/RecentTasks';

export default function Dashboard() {
  const { user } = useAuth();
  const { tasks, stats, loading, fetchTasks } = useTasks();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const firstName = user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Here's what's happening with your tasks today.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => navigate('/tasks')}
        >
          New Task
        </Button>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} loading={loading} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TaskChart tasks={tasks} stats={stats} />
      </div>

      {/* Recent tasks */}
      <RecentTasks tasks={tasks.slice(0, 5)} loading={loading} />
    </div>
  );
}

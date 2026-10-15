import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import Button from '../components/ui/Button';
import StatsCards from '../components/dashboard/StatsCards';
import TaskChart from '../components/dashboard/TaskChart';
import RecentTasks from '../components/dashboard/RecentTasks';
import ProductivityScore from '../components/dashboard/ProductivityScore';
import UpcomingDeadlines from '../components/dashboard/UpcomingDeadlines';
import WeeklyProgress from '../components/dashboard/WeeklyProgress';

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
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Here's what's happening with your tasks today.
          </p>
        </div>
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => navigate('/tasks')}
          >
            New Task
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
        <StatsCards stats={stats} loading={loading} />
      </div>

      {/* Charts + Productivity row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 opacity-0 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
        <div className="lg:col-span-2">
          <TaskChart tasks={tasks} stats={stats} />
        </div>
        <ProductivityScore stats={stats} />
      </div>

      {/* Weekly + Deadlines row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <WeeklyProgress tasks={tasks} />
        <UpcomingDeadlines tasks={tasks} loading={loading} />
      </div>

      {/* Recent tasks */}
      <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '350ms' }}>
        <RecentTasks tasks={tasks.slice(0, 5)} loading={loading} />
      </div>
    </div>
  );
}

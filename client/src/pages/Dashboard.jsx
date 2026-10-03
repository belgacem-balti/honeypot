import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import Button from '../components/ui/Button';
import StatsCards from '../components/dashboard/StatsCards';
import TaskChart from '../components/dashboard/TaskChart';
import RecentTasks from '../components/dashboard/RecentTasks';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

export default function Dashboard() {
  const { user } = useAuth();
  const { tasks, stats, loading, fetchTasks } = useTasks();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}!</p>
        </div>
        <Button 
          variant="primary" 
          icon={Plus} 
          onClick={() => navigate('/tasks')}
        >
          Create Task
        </Button>
      </div>

      <StatsCards stats={stats} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskChart tasks={tasks} stats={stats} />
      </div>

      <RecentTasks tasks={tasks.slice(0, 5)} loading={loading} />
    </div>
  );
}

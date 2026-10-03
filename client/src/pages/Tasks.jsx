import React, { useEffect, useState } from 'react';
import { Plus, ClipboardList } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import TaskCard from '../components/tasks/TaskCard';
import TaskForm from '../components/tasks/TaskForm';
import TaskFilters from '../components/tasks/TaskFilters';
import toast from 'react-hot-toast';

export default function Tasks() {
  const { 
    tasks, loading, filters, setFilters, 
    fetchTasks, createTask, updateTask, deleteTask, updateTaskStatus 
  } = useTasks();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, filters]);

  const handleOpenCreate = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (taskData) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, taskData);
        toast.success('Task updated successfully');
      } else {
        await createTask(taskData);
        toast.success('Task created successfully');
      }
      setIsFormOpen(false);
    } catch (err) {
      toast.error('An error occurred');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteTask(deleteConfirm.id);
      toast.success('Task deleted');
      setDeleteConfirm(null);
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      toast.success('Status updated');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">{tasks.length} tasks found</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
          New Task
        </Button>
      </div>

      <TaskFilters filters={filters} onFilterChange={setFilters} />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <LoadingSkeleton type="card" count={6} />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState 
          icon={ClipboardList} 
          title="No tasks yet" 
          description="Create your first task to get started"
          action={{ label: 'Create Task', onClick: handleOpenCreate }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onEdit={() => handleOpenEdit(task)}
              onDelete={() => setDeleteConfirm(task)}
              onStatusChange={(status) => handleStatusChange(task.id, status)}
            />
          ))}
        </div>
      )}

      <TaskForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSubmit={handleFormSubmit}
        task={editingTask}
      />

      <ConfirmDialog 
        isOpen={!!deleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteConfirm?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

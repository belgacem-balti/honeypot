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
      } else {
        await createTask(taskData);
      }
      setIsFormOpen(false);
    } catch (err) {
      // toast already handled in hook
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteTask(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (err) {
      // toast already handled
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (err) {
      // toast already handled
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading...' : `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button variant="primary" size="md" icon={Plus} onClick={handleOpenCreate}>
          New Task
        </Button>
      </div>

      {/* Filters */}
      <TaskFilters filters={filters} onFilterChange={setFilters} />

      {/* Task grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <LoadingSkeleton type="card" count={6} />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No tasks found"
          description={filters.status || filters.priority || filters.search
            ? 'Try adjusting your filters to find what you\'re looking for.'
            : 'Create your first task to get started.'}
          action={!filters.status && !filters.priority && !filters.search ? handleOpenCreate : undefined}
          actionLabel="Create Task"
          actionIcon={Plus}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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

      {/* Form modal */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        task={editingTask}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete task"
        message={`Are you sure you want to delete "${deleteConfirm?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

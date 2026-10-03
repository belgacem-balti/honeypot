import { useState, useEffect, useCallback } from 'react';
import { tasks as tasksApi } from '../services/api';
import { toast } from 'react-hot-toast';

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0, todo: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });

  const fetchTasks = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await tasksApi.getAll({ ...filters, ...params });
      const data = res.data?.data || res.data;
      setTasks(data.tasks || []);
      if (data.stats) setStats(data.stats);
      if (data.pagination) setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (data) => {
    try {
      await tasksApi.create(data);
      toast.success('Task created successfully');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to create task');
      throw error;
    }
  };

  const updateTask = async (id, data) => {
    try {
      await tasksApi.update(id, data);
      toast.success('Task updated successfully');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to update task');
      throw error;
    }
  };

  const deleteTask = async (id) => {
    try {
      await tasksApi.delete(id);
      toast.success('Task deleted successfully');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to delete task');
      throw error;
    }
  };

  const updateTaskStatus = async (id, status) => {
    try {
      await tasksApi.updateStatus(id, status);
      toast.success('Status updated successfully');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to update status');
      throw error;
    }
  };

  return { tasks, stats, pagination, loading, filters, setFilters, fetchTasks, createTask, updateTask, deleteTask, updateTaskStatus };
};

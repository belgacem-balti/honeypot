import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import Select from '../ui/Select';
import Button from '../ui/Button';

export default function TaskFilters({ filters, onFilterChange }) {
  const [searchValue, setSearchValue] = useState(filters?.search || '');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters?.search !== searchValue) {
        onFilterChange({ ...filters, search: searchValue });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, filters, onFilterChange]);

  const handleStatusChange = (e) => {
    onFilterChange({ ...filters, status: e.target.value });
  };

  const handlePriorityChange = (e) => {
    onFilterChange({ ...filters, priority: e.target.value });
  };

  const handleClear = () => {
    setSearchValue('');
    onFilterChange({ search: '', status: '', priority: '' });
  };

  const hasActiveFilters = searchValue || filters?.status || filters?.priority;

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'TODO', label: 'To Do' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' }
  ];

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' }
  ];

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      <div className="relative flex-1 w-full sm:min-w-[200px]">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search tasks..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all duration-200"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>
      
      <div className="flex gap-4 w-full sm:w-auto">
        <Select 
          name="status"
          value={filters?.status || ''}
          onChange={handleStatusChange}
          options={statusOptions}
          className="min-w-[140px]"
        />
        
        <Select 
          name="priority"
          value={filters?.priority || ''}
          onChange={handlePriorityChange}
          options={priorityOptions}
          className="min-w-[140px]"
        />
        
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            icon={X} 
            onClick={handleClear}
            className="text-gray-500 hover:text-gray-700 h-10 px-3"
            aria-label="Clear filters"
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

const priorityOptions = [
  { value: '', label: 'All priorities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
];

export default function TaskFilters({ filters, onFilterChange }) {
  const [searchValue, setSearchValue] = useState(filters?.search || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters?.search !== searchValue) {
        onFilterChange({ ...filters, search: searchValue });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

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

  return (
    <div className="card p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search tasks..."
          className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200/60 rounded-lg text-sm text-gray-700 placeholder-gray-400 outline-none transition-all
            hover:border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 focus:bg-white"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      {/* Selects */}
      <div className="flex items-center gap-2">
        <select
          value={filters?.status || ''}
          onChange={handleStatusChange}
          className="input-field py-2 text-xs min-w-[120px] bg-gray-50"
        >
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={filters?.priority || ''}
          onChange={handlePriorityChange}
          className="input-field py-2 text-xs min-w-[120px] bg-gray-50"
        >
          {priorityOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

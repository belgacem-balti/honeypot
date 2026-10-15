import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, Flag } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const priorityColors = {
  HIGH: 'bg-danger-500',
  MEDIUM: 'bg-warning-500',
  LOW: 'bg-success-500',
};

const statusColors = {
  TODO: 'border-l-gray-400',
  IN_PROGRESS: 'border-l-primary-500',
  COMPLETED: 'border-l-success-500',
};

export default function Calendar() {
  const { tasks } = useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const getTasksForDay = (day) => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const due = new Date(task.dueDate);
      return due.getDate() === day && due.getMonth() === month && due.getFullYear() === year;
    });
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const calendarDays = [];

  // Previous month's trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({ day: daysInPrevMonth - i, isCurrentMonth: false, isPrev: true });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({ day: d, isCurrentMonth: true });
  }

  // Next month's leading days
  const remaining = 42 - calendarDays.length;
  for (let d = 1; d <= remaining; d++) {
    calendarDays.push({ day: d, isCurrentMonth: false, isNext: true });
  }

  const selectedDayTasks = selectedDate ? getTasksForDay(selectedDate) : [];

  // Calculate stats
  const tasksThisMonth = tasks.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return d.getMonth() === month && d.getFullYear() === year;
  });
  const overdue = tasks.filter((t) => {
    if (!t.dueDate || t.status === 'COMPLETED') return false;
    return new Date(t.dueDate) < today;
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Calendar</h1>
          <p className="text-sm text-gray-500 mt-1">View your tasks and deadlines at a glance</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToToday} className="btn-secondary btn-sm">Today</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3 card p-5">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {MONTHS[month]} {year}
            </h2>
            <div className="flex items-center gap-1">
              <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 border-t border-l border-gray-100">
            {calendarDays.map((cell, i) => {
              const dayTasks = cell.isCurrentMonth ? getTasksForDay(cell.day) : [];
              const isSelected = selectedDate === cell.day && cell.isCurrentMonth;
              return (
                <div
                  key={i}
                  onClick={() => cell.isCurrentMonth && setSelectedDate(cell.day === selectedDate ? null : cell.day)}
                  className={`min-h-[100px] p-2 border-b border-r border-gray-100 cursor-pointer transition-all duration-200
                    ${!cell.isCurrentMonth ? 'bg-gray-50/50' : 'hover:bg-primary-50/30'}
                    ${isSelected ? 'bg-primary-50 ring-1 ring-primary-200 ring-inset' : ''}
                  `}
                >
                  <span className={`inline-flex items-center justify-center w-7 h-7 text-sm rounded-full
                    ${isToday(cell.day) && cell.isCurrentMonth ? 'bg-primary-600 text-white font-semibold' : ''}
                    ${!cell.isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                    ${isSelected && !isToday(cell.day) ? 'font-semibold text-primary-600' : ''}
                  `}>
                    {cell.day}
                  </span>

                  {dayTasks.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {dayTasks.slice(0, 2).map((task) => (
                        <div
                          key={task.id}
                          className={`text-xxs px-1.5 py-0.5 rounded truncate border-l-2 ${statusColors[task.status] || ''} bg-gray-50`}
                        >
                          {task.title}
                        </div>
                      ))}
                      {dayTasks.length > 2 && (
                        <span className="text-xxs text-gray-400 pl-1">+{dayTasks.length - 2} more</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Month stats */}
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">This Month</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total tasks</span>
                <span className="text-sm font-semibold text-gray-900">{tasksThisMonth.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Completed</span>
                <span className="text-sm font-semibold text-success-600">
                  {tasksThisMonth.filter((t) => t.status === 'COMPLETED').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Overdue</span>
                <span className="text-sm font-semibold text-danger-600">{overdue.length}</span>
              </div>
            </div>
          </div>

          {/* Selected day tasks */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              {selectedDate
                ? `${MONTHS[month]} ${selectedDate}`
                : 'Select a date'}
            </h3>

            {selectedDate ? (
              selectedDayTasks.length > 0 ? (
                <div className="space-y-2">
                  {selectedDayTasks.map((task) => (
                    <div key={task.id} className={`p-3 rounded-xl bg-gray-50 border-l-2 ${statusColors[task.status]}`}>
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${priorityColors[task.priority]}`} />
                        <span className="text-xxs text-gray-400 capitalize">{task.priority?.toLowerCase()}</span>
                        <span className="text-xxs text-gray-300">·</span>
                        <span className="text-xxs text-gray-400 capitalize">{task.status?.replace('_', ' ').toLowerCase()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No tasks on this date</p>
              )
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Click a date to see tasks</p>
            )}
          </div>

          {/* Upcoming deadlines */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Upcoming Deadlines</h3>
            <div className="space-y-2">
              {tasks
                .filter((t) => t.dueDate && new Date(t.dueDate) >= today && t.status !== 'COMPLETED')
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                .slice(0, 5)
                .map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityColors[task.priority]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{task.title}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xxs text-gray-400">
                          {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              {tasks.filter((t) => t.dueDate && new Date(t.dueDate) >= today && t.status !== 'COMPLETED').length === 0 && (
                <p className="text-sm text-gray-400 text-center py-3">No upcoming deadlines</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

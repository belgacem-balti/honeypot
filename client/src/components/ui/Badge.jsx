import React from 'react';

const variants = {
  success: 'bg-success-50 text-success-700 ring-1 ring-inset ring-success-600/10',
  warning: 'bg-warning-50 text-warning-700 ring-1 ring-inset ring-warning-600/10',
  error: 'bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-600/10',
  info: 'bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-600/10',
  default: 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10',
};

const sizes = {
  sm: 'badge-sm',
  md: 'badge-md',
};

const Badge = ({ children, variant = 'default', size = 'sm', dot = false, className = '' }) => {
  return (
    <span className={`badge ${variants[variant]} ${sizes[size]} ${className}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          variant === 'success' ? 'bg-success-500' :
          variant === 'warning' ? 'bg-warning-500' :
          variant === 'error' ? 'bg-danger-500' :
          variant === 'info' ? 'bg-primary-500' :
          'bg-gray-400'
        }`} />
      )}
      {children}
    </span>
  );
};

export default Badge;

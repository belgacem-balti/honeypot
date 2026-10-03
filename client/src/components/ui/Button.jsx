import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({ variant = 'primary', size = 'md', children, loading = false, icon: Icon, className = '', disabled, ...props }) => {
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white border border-transparent',
    secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
    danger: 'bg-red-600 hover:bg-red-700 text-white border border-transparent',
    ghost: 'text-gray-600 hover:bg-gray-100 border border-transparent',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const classes = `inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className={`w-4 h-4 animate-spin ${children ? 'mr-2' : ''}`} />}
      {!loading && Icon && (
        React.isValidElement(Icon) ? (
          Icon
        ) : (
          <Icon className={`w-4 h-4 ${children ? 'mr-2' : ''}`} />
        )
      )}
      {children}
    </button>
  );
};

export default Button;

import React from 'react';
import Button from './Button';

const EmptyState = ({ icon: Icon, title, description, action, actionLabel, actionIcon }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
          <Icon className="w-7 h-7 text-gray-400" />
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mt-1.5 max-w-sm leading-relaxed">{description}</p>
      )}
      {action && (
        <div className="mt-5">
          <Button variant="primary" size="md" icon={actionIcon} onClick={action}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;

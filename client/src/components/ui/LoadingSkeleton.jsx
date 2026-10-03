import React from 'react';

const LoadingSkeleton = ({ count = 1, type = 'row' }) => {
  const styles = {
    card: 'h-32 rounded-xl',
    row: 'h-16 rounded-lg',
    stat: 'h-24 rounded-xl',
  };

  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`animate-pulse bg-gray-200 w-full ${styles[type]}`} />
      ))}
    </div>
  );
};

export default LoadingSkeleton;

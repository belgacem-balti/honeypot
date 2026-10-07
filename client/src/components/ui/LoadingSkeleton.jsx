import React from 'react';

const types = {
  card: 'h-[120px] rounded-xl',
  row: 'h-14 rounded-lg',
  stat: 'h-[100px] rounded-xl',
  text: 'h-4 rounded',
  avatar: 'h-10 w-10 rounded-full',
  chart: 'h-[240px] rounded-xl',
};

const LoadingSkeleton = ({ type = 'card', count = 1, className = '' }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`skeleton ${types[type]} ${className}`}
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </>
  );
};

export default LoadingSkeleton;

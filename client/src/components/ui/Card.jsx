import React from 'react';

const Card = ({ children, className = '', padding = 'md', ...props }) => {
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div className={`card ${paddings[padding]} ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;

import React from 'react';

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

const Card = ({ children, padding = 'md', hover = false, interactive = false, className = '', ...props }) => {
  const base = interactive ? 'card-interactive' : hover ? 'card-hover' : 'card';

  return (
    <div className={`${base} ${paddings[padding]} ${className}`} {...props}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '' }) => (
  <div className={`flex items-center justify-between mb-4 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`section-title ${className}`}>{children}</h3>
);

const CardDescription = ({ children, className = '' }) => (
  <p className={`section-subtitle mt-0.5 ${className}`}>{children}</p>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;

export default Card;

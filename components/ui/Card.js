import React from 'react';
import { twMerge } from 'tailwind-merge';

const Card = ({ 
  children, 
  className = '', 
  variant = 'default',
  ...props 
}) => {
  const baseClasses = 'card rounded-xl shadow-md transition-all duration-300';
  
  const variantClasses = {
    default: 'bg-white',
    bordered: 'bg-white border border-gray-200',
    flat: 'bg-light shadow-sm',
    colored: 'bg-primary-50',
  };

  const classes = twMerge(
    baseClasses,
    variantClasses[variant],
    className
  );

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card; 
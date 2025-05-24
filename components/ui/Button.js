import React from 'react';
import Link from 'next/link';
import { twMerge } from 'tailwind-merge';

const Button = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  href,
  isLink = false,
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) => {
  const baseClasses = 'btn inline-flex items-center justify-center font-medium transition-all duration-300';
  const sizeClasses = {
    sm: 'py-1 px-3 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-3 px-6 text-lg'
  };
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'border border-primary text-primary hover:bg-primary-50',
    ghost: 'text-primary hover:bg-primary-50',
  };

  const classes = twMerge(
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    disabled && 'opacity-60 cursor-not-allowed',
    className
  );

  if (isLink && href) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button; 
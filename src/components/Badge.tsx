import { ReactNode } from 'react';

type BadgeVariant = 'pending' | 'partial' | 'completed';

interface BadgeProps {
  children: ReactNode;
  variant: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  partial: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-gray-100 text-gray-700 border-gray-200',
};

export default function Badge({ children, variant, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}

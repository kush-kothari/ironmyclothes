import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`rounded-2xl bg-white shadow-soft border border-gray-100 overflow-hidden transition hover:shadow-soft-lg ${onClick ? 'cursor-pointer active:scale-[0.99]' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {children}
    </div>
  );
}

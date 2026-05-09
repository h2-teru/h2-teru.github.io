import type { PropsWithChildren } from 'react';

interface Props {
  onClick?: () => void;
  variant?: 'cyan' | 'magenta' | 'red' | 'ghost';
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export function NeonButton({
  onClick,
  children,
  variant = 'cyan',
  className = '',
  type = 'button',
  disabled,
}: PropsWithChildren<Props>) {
  const variants: Record<NonNullable<Props['variant']>, string> = {
    cyan: 'border-neon-cyan text-neon-cyan hover:shadow-neon hover:bg-neon-cyan/10',
    magenta: 'border-neon-magenta text-neon-magenta hover:shadow-neon-magenta hover:bg-neon-magenta/10',
    red: 'border-neon-red text-neon-red hover:shadow-neon-red hover:bg-neon-red/10',
    ghost: 'border-bg-700 text-neon-cyan/70 hover:border-neon-cyan/40 hover:text-neon-cyan',
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`relative font-mono uppercase tracking-widest text-sm
        border bg-bg-800/80 px-6 py-3 transition-all
        active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant]} ${className}`}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
}

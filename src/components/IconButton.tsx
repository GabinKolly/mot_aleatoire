import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  className?: string;
  variant?: 'default' | 'mockup';
  children: ReactNode;
}

export default function IconButton({
  label,
  className = '',
  type = 'button',
  variant = 'default',
  children,
  ...props
}: IconButtonProps) {
  const variantClassName =
    variant === 'mockup'
      ? 'mm-icon-button'
      : 'btn btn-icon btn-icon-neutral';

  return (
    <button
      {...props}
      type={type}
      aria-label={label}
      className={`${variantClassName} ${className}`.trim()}
    >
      {children}
    </button>
  );
}

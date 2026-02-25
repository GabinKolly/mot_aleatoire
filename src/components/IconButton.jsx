export default function IconButton({
  label,
  className = '',
  type = 'button',
  variant = 'default',
  children,
  ...props
}) {
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

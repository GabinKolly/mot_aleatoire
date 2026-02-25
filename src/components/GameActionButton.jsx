const GAME_ACTION_BUTTON_CLASS =
  'btn btn-primary btn-lg';

export default function GameActionButton({
  icon: Icon,
  children,
  className = '',
  ...props
}) {
  return (
    <button {...props} className={`${GAME_ACTION_BUTTON_CLASS} ${className}`.trim()}>
      {Icon && <Icon className="w-6 h-6" />}
      {children}
    </button>
  );
}

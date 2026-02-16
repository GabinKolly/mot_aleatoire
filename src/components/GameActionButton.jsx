import BlackButton from './BlackButton';

const GAME_ACTION_BUTTON_CLASS =
  'inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white text-xl font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg';

export default function GameActionButton({
  icon: Icon,
  children,
  className = '',
  ...props
}) {
  return (
    <BlackButton {...props} className={`${GAME_ACTION_BUTTON_CLASS} ${className}`.trim()}>
      {Icon && <Icon className="w-6 h-6" />}
      {children}
    </BlackButton>
  );
}

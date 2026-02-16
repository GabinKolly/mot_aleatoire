const BLACK_BUTTON_STYLE = Object.freeze({
  backgroundColor: '#000000',
  color: '#ffffff',
  border: '1px solid #000000',
});

export default function BlackButton({
  className = '',
  style = {},
  children,
  ...props
}) {
  return (
    <button {...props} className={className} style={{ ...BLACK_BUTTON_STYLE, ...style }}>
      {children}
    </button>
  );
}

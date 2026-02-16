export default function SettingsNumberField({
  label,
  value,
  min,
  max,
  onChange,
  onBlur,
}) {
  return (
    <div>
      <label className="block text-sm text-black mb-1">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  );
}

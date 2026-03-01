interface SettingsNumberFieldProps {
  label: string;
  value: string;
  min: number;
  max: number;
  onChange: (value: string) => void;
  onBlur: () => void;
}

export default function SettingsNumberField({
  label,
  value,
  min,
  max,
  onChange,
  onBlur,
}: SettingsNumberFieldProps) {

  return (
    <div className="mm-form-field">
      <label className="mm-form-field__label">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className="mm-input"
      />
    </div>
  );
}

import { useId } from "react";

export interface TextFieldProps {
  autoComplete?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white";

const labelClass = "mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300";
export const TextField = ({
  autoComplete,
  className = "text-field",
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  disabled,
}: TextFieldProps) => {
  const inputId = useId();
  return (
    <div className={className}>
      {label && (
        <label className={labelClass} htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        autoComplete={autoComplete}
        className={disabled ? `${inputClass} disabled:opacity-60` : inputClass}
        disabled={disabled}
        id={inputId}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
    </div>
  );
};
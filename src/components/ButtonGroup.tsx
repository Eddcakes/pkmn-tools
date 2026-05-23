import { type ButtonSize, getButtonClasses } from "../utils/buttonStyles";

export interface ButtonGroupOption<T extends string = string> {
  value: T;
  label: string;
  ariaLabel?: string;
}

interface ButtonGroupProps<T extends string = string> {
  value: T | "";
  onChange: (value: T) => void;
  options: ButtonGroupOption<T>[];
  disabled?: boolean;
  size?: ButtonSize;
  id?: string;
  name?: string;
  className?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
}

export function ButtonGroup<T extends string = string>({
  value,
  onChange,
  options,
  disabled = false,
  size = "sm",
  id,
  name,
  className = "",
  ariaLabel,
  ariaLabelledBy
}: ButtonGroupProps<T>) {
  return (
    <fieldset
      id={id}
      disabled={disabled}
      aria-labelledby={ariaLabelledBy}
      className={`border-0 p-0 m-0 min-w-0 flex isolate ${className}`.trim()}
    >
      {ariaLabel ? <legend className="sr-only">{ariaLabel}</legend> : null}
      {options.map((option, index) => {
        const selected = value === option.value;
        const edgeClass =
          index === 0
            ? "rounded-r-none"
            : index === options.length - 1
              ? "rounded-l-none -ml-px"
              : "rounded-none -ml-px";

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            aria-label={option.ariaLabel ?? option.label}
            name={name}
            disabled={disabled}
            className={getButtonClasses(
              selected ? "primary" : "outline",
              size,
              `${edgeClass} min-w-10 relative z-0 hover:z-10 focus:z-20 focus-visible:z-20 disabled:cursor-not-allowed disabled:opacity-50`.trim()
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </fieldset>
  );
}

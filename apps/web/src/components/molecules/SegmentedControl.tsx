import type { ReactNode } from 'react';

interface SegmentedControlProps<T extends string> {
  label: string;
  options: { value: T; label: ReactNode }[];
  /** Opción marcada; `null` si ninguna coincide (p. ej. un rango de fechas a mano). */
  value: T | null;
  onChange: (value: T) => void;
}

/** Grupo de botones excluyentes para filtrar (ADR 0011); cada uno anuncia si está activo. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex max-w-full gap-1 overflow-x-auto rounded-lg border border-line bg-canvas p-1"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary ${
            value === option.value
              ? 'bg-surface text-primary-strong shadow-card ring-1 ring-line'
              : 'text-ink-soft hover:bg-surface/70 hover:text-ink'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

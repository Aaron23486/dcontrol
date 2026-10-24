import {
  DATE_PRESETS,
  activePreset,
  presetRange,
  type DatePreset,
  type DateRange,
} from '../../lib/date-range';
import { Input } from '../atoms/Input';

const PRESET_LABEL: Record<DatePreset, string> = {
  today: 'Hoy',
  last7: 'Últimos 7 días',
  month: 'Este mes',
  all: 'Todo',
};

interface DateRangeFilterProps {
  range: DateRange;
  today: Date;
  onChange: (range: DateRange) => void;
}

/** Atajos de fechas y rango desde-hasta (días del CEDI). */
export function DateRangeFilter({ range, today, onChange }: DateRangeFilterProps) {
  const preset = activePreset(range, today);
  return (
    <div className="space-y-3">
      <div role="group" aria-label="Rango de fechas" className="flex flex-wrap gap-2">
        {DATE_PRESETS.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={preset === item}
            onClick={() => onChange(presetRange(item, today))}
            className={`min-h-10 rounded-full border px-4 py-1 text-sm ${
              preset === item
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            {PRESET_LABEL[item]}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
        <label className="text-sm text-slate-700">
          Desde
          <Input
            type="date"
            value={range.from ?? ''}
            max={range.to}
            onChange={(event) => onChange({ ...range, from: event.target.value || undefined })}
          />
        </label>
        <label className="text-sm text-slate-700">
          Hasta
          <Input
            type="date"
            value={range.to ?? ''}
            min={range.from}
            onChange={(event) => onChange({ ...range, to: event.target.value || undefined })}
          />
        </label>
      </div>
    </div>
  );
}

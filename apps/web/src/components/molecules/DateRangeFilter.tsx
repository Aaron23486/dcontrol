import {
  DATE_PRESETS,
  activePreset,
  presetRange,
  type DatePreset,
  type DateRange,
} from '../../lib/date-range';
import { Input } from '../atoms/Input';
import { SegmentedControl } from './SegmentedControl';

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

/** Atajos de fechas y rango desde-hasta (días del CEDI), en una sola fila si hay espacio. */
export function DateRangeFilter({ range, today, onChange }: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <SegmentedControl
        label="Rango de fechas"
        value={activePreset(range, today) ?? null}
        onChange={(preset) => onChange(presetRange(preset, today))}
        options={DATE_PRESETS.map((preset) => ({ value: preset, label: PRESET_LABEL[preset] }))}
      />
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
          Desde
          <Input
            type="date"
            value={range.from ?? ''}
            max={range.to}
            onChange={(event) => onChange({ ...range, from: event.target.value || undefined })}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
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

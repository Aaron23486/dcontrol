import { Icon, type IconName } from '../atoms/Icon';

type Tone = 'primary' | 'success' | 'danger' | 'warning';

/** El ícono va sobre un fondo suave del color del indicador (ADR 0011). */
const TONES: Record<Tone, string> = {
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-warning',
};

interface StatTileProps {
  label: string;
  value: number;
  icon: IconName;
  tone: Tone;
  /** Estado que requiere atención: ámbar, siempre con ícono y texto, nunca solo color. */
  attention?: string;
}

export function StatTile({ label, value, icon, tone, attention }: StatTileProps) {
  const needsAttention = Boolean(attention) && value > 0;
  return (
    <div
      className={`flex items-center gap-3.5 rounded-card border p-3 shadow-card ${
        needsAttention ? 'border-warning/50 bg-warning-soft/40' : 'border-line bg-surface'
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg sm:h-14 sm:w-14 xl:h-16 xl:w-16 ${TONES[tone]}`}
      >
        <Icon name={icon} className="h-6 w-6 sm:h-7 sm:w-7" />
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-medium leading-tight text-ink-soft">{label}</p>
        <p className="mt-1 text-[1.75rem] font-bold leading-none text-ink">
          {value.toLocaleString('es')}
        </p>
        {needsAttention && (
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-warning-strong">
            <Icon name="alert" className="h-3.5 w-3.5" />
            {attention}
          </p>
        )}
      </div>
    </div>
  );
}

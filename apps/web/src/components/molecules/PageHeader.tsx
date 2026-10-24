import type { ReactNode } from 'react';
import { Icon, type IconName } from '../atoms/Icon';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: IconName;
  /** Acciones principales de la pantalla, alineadas a la derecha. */
  actions?: ReactNode;
}

/** Encabezado de cada pantalla (ADR 0011): título, descripción breve y acciones. */
export function PageHeader({ title, description, icon, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Icon name={icon} className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
          {description && <p className="text-sm text-ink-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

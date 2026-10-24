import { type ReactNode, useId } from 'react';
import { Icon, type IconName } from '../atoms/Icon';

interface CardProps {
  /** Si se indica, la tarjeta es una sección con encabezado (título, ícono y acción). */
  title?: string;
  icon?: IconName;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

/** Contenedor blanco del sistema de diseño (ADR 0011). */
export function Card({
  title,
  icon,
  action,
  className = '',
  bodyClassName = '',
  children,
}: CardProps) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={title ? titleId : undefined}
      className={`flex min-w-0 flex-col rounded-card border border-line bg-surface shadow-card ${className}`}
    >
      {title && (
        <div className="flex shrink-0 items-center justify-between gap-3 px-4 pb-3 pt-3.5">
          <h2 id={titleId} className="flex items-center gap-2.5 text-base font-semibold text-ink">
            {icon && <Icon name={icon} className="h-5 w-5 text-primary" />}
            {title}
          </h2>
          {action}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Icon } from '../atoms/Icon';

const CLASSES =
  'inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-primary-strong hover:underline';

/** Volver a la pantalla anterior: a una ruta fija (`to`) o al historial del navegador (`onClick`). */
export function BackLink({
  to,
  onClick,
  children,
}: {
  to?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  const content = (
    <>
      <Icon name="arrowLeft" className="h-4 w-4" />
      {children}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={CLASSES}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={CLASSES}>
      {content}
    </button>
  );
}

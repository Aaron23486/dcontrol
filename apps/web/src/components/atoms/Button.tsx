import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router';

/** primary: la acción principal; secondary: el resto; soft: interruptores (p. ej. el sonido). */
type Variant = 'primary' | 'secondary' | 'soft';

const BASE =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover disabled:bg-ink-muted/60',
  secondary:
    'border border-line bg-surface text-ink shadow-card hover:bg-canvas disabled:text-ink-muted',
  soft: 'border border-primary/20 bg-primary-soft text-primary-strong hover:bg-primary/15',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${BASE} disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

/** Un enlace que se ve como botón (p. ej. «Registrar persona», que lleva a otra pantalla). */
export function ButtonLink({
  variant = 'primary',
  className = '',
  ...props
}: LinkProps & { variant?: Variant }) {
  return <Link className={`${BASE} ${VARIANTS[variant]} ${className}`} {...props} />;
}

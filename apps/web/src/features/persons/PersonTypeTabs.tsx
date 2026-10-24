import { NavLink } from 'react-router';
import { PERSON_SECTIONS } from './person-sections';

interface PersonTypeTabsProps {
  /** Ruta base de las secciones, p. ej. `/personas` o `/historial`. */
  basePath: string;
  /** Parámetros a conservar al cambiar de pestaña (p. ej. los filtros de fecha). */
  search?: string;
  /** Margen interior, p. ej. para alinear las pestañas con el contenido de una tarjeta. */
  className?: string;
}

/** Una pestaña por tipo de persona, para no mezclar información (spec §15, ADR 0009). */
export function PersonTypeTabs({ basePath, search = '', className = '' }: PersonTypeTabsProps) {
  return (
    <nav
      aria-label="Tipos de persona"
      className={`flex gap-6 overflow-x-auto border-b border-line ${className}`}
    >
      {PERSON_SECTIONS.map((section) => (
        <NavLink
          key={section.slug}
          to={`${basePath}/${section.slug}${search}`}
          className={({ isActive }) =>
            `flex min-h-12 items-center whitespace-nowrap border-b-2 text-sm ${
              isActive
                ? 'border-primary font-semibold text-primary-strong'
                : 'border-transparent font-medium text-ink-soft hover:text-ink'
            }`
          }
        >
          {section.title}
        </NavLink>
      ))}
    </nav>
  );
}

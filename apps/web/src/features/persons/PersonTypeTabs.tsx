import { NavLink } from 'react-router';
import { PERSON_SECTIONS } from './person-sections';

interface PersonTypeTabsProps {
  /** Ruta base de las secciones, p. ej. `/personas` o `/historial`. */
  basePath: string;
  /** Parámetros a conservar al cambiar de pestaña (p. ej. los filtros de fecha). */
  search?: string;
}

/** Una pestaña por tipo de persona, para no mezclar información (spec §15, ADR 0009). */
export function PersonTypeTabs({ basePath, search = '' }: PersonTypeTabsProps) {
  return (
    <nav
      aria-label="Tipos de persona"
      className="flex gap-1 overflow-x-auto border-b border-slate-200"
    >
      {PERSON_SECTIONS.map((section) => (
        <NavLink
          key={section.slug}
          to={`${basePath}/${section.slug}${search}`}
          className={({ isActive }) =>
            `whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
              isActive
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`
          }
        >
          {section.title}
        </NavLink>
      ))}
    </nav>
  );
}

import { Role } from '@cedi/shared';
import { NavLink, Outlet } from 'react-router';
import { useLogout, useSession } from '../../features/auth/use-session';
import { Button } from '../atoms/Button';

interface NavItem {
  to: string;
  label: string;
  end: boolean;
  /** Si se indica, solo esos roles ven la opción (la API también lo comprueba). */
  roles?: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Ingreso y salida', end: true },
  { to: '/dentro', label: 'Dentro', end: false },
  { to: '/historial', label: 'Historial', end: false },
  { to: '/personas', label: 'Personas', end: false },
  { to: '/auditoria', label: 'Auditoría', end: false, roles: [Role.ADMIN] },
];

const ROLE_LABEL: Record<Role, string> = {
  [Role.SECURITY]: 'Seguridad',
  [Role.ADMIN]: 'Administrador',
};

export function AppLayout() {
  const { data: user } = useSession();
  const logout = useLogout();
  return (
    <div className="min-h-screen">
      {/* Primer elemento con Tab: salta el menú y lleva al contenido de la pantalla. */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow"
      >
        Saltar al contenido
      </a>
      {/* En pantallas pequeñas el menú pasa a su propia fila para no ocultar «Cerrar sesión». */}
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-slate-200 bg-white px-4 py-3">
        <span className="font-semibold">CEDI Control</span>
        <nav
          aria-label="Principal"
          className="order-last flex w-full gap-4 overflow-x-auto text-sm md:order-none md:mr-auto md:w-auto"
        >
          {NAV_ITEMS.filter((item) => !item.roles || (user && item.roles.includes(user.role))).map(
            (item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap ${isActive ? 'font-medium text-slate-900' : 'text-slate-500 hover:text-slate-900'}`
                }
              >
                {item.label}
              </NavLink>
            ),
          )}
        </nav>
        {user && (
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden lg:inline">
              {user.name} · <span className="text-slate-500">{ROLE_LABEL[user.role]}</span>
            </span>
            <Button variant="secondary" onClick={() => logout.mutate()} disabled={logout.isPending}>
              Cerrar sesión
            </Button>
          </div>
        )}
      </header>
      <main id="contenido" tabIndex={-1} className="p-4 focus:outline-none">
        <Outlet />
      </main>
    </div>
  );
}

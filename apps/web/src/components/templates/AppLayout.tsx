import { Role } from '@cedi/shared';
import { NavLink, Outlet } from 'react-router';
import { useLogout, useSession } from '../../features/auth/use-session';
import { Button } from '../atoms/Button';
import { Icon, Logo } from '../atoms/Icon';

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
    <div className="min-h-dvh">
      {/* Primer elemento con Tab: salta el menú y lleva al contenido de la pantalla. */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-strong focus:shadow"
      >
        Saltar al contenido
      </a>
      {/* En pantallas pequeñas el menú pasa a su propia fila para no ocultar «Cerrar sesión». */}
      <header className="flex flex-wrap items-center justify-between gap-x-8 border-b border-line bg-surface px-4 md:h-(--header-height) md:flex-nowrap lg:px-6">
        <span className="flex items-center gap-2.5 py-2 text-lg font-bold tracking-tight text-ink">
          <Logo />
          CEDI Control
        </span>
        <nav
          aria-label="Principal"
          className="order-last -mx-4 flex w-[calc(100%+2rem)] gap-6 overflow-x-auto lg:gap-9 border-t border-line px-4 text-sm md:order-none md:mx-0 md:mr-auto md:w-auto md:self-stretch md:border-0 md:px-0"
        >
          {NAV_ITEMS.filter((item) => !item.roles || (user && item.roles.includes(user.role))).map(
            (item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex h-11 items-center whitespace-nowrap border-b-2 md:h-full ${
                    isActive
                      ? 'border-primary font-semibold text-primary-strong'
                      : 'border-transparent font-medium text-ink-soft hover:text-ink'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ),
          )}
        </nav>
        {user && (
          <div className="flex items-center gap-4 py-2 text-sm">
            <span className="hidden text-ink-muted lg:inline">
              {user.name} · {ROLE_LABEL[user.role]}
            </span>
            <Button variant="secondary" onClick={() => logout.mutate()} disabled={logout.isPending}>
              <Icon name="logout" className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        )}
      </header>
      <main
        id="contenido"
        tabIndex={-1}
        className="p-4 focus:outline-none lg:px-6 lg:py-(--page-py)"
      >
        <Outlet />
      </main>
    </div>
  );
}

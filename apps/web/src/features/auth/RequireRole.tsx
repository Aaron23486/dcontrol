import type { Role } from '@cedi/shared';
import type { ReactNode } from 'react';
import { EmptyState } from '../../components/molecules/EmptyState';
import { useSession } from './use-session';

/**
 * Muestra el contenido solo a los roles indicados. Es una ayuda de interfaz:
 * la API vuelve a comprobar el rol en cada petición.
 */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { data: user } = useSession();
  if (!user || !roles.includes(user.role)) {
    return (
      <div className="mx-auto max-w-xl">
        <EmptyState>No tienes permiso para ver esta sección.</EmptyState>
      </div>
    );
  }
  return <>{children}</>;
}

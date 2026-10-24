import type { Role } from '@cedi/shared';
import type { ReactNode } from 'react';
import { useSession } from './use-session';

/**
 * Muestra el contenido solo a los roles indicados. Es una ayuda de interfaz:
 * la API vuelve a comprobar el rol en cada petición.
 */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { data: user } = useSession();
  if (!user || !roles.includes(user.role)) {
    return (
      <p className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
        No tienes permiso para ver esta sección.
      </p>
    );
  }
  return <>{children}</>;
}

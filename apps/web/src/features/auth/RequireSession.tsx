import { Navigate, Outlet } from 'react-router';
import { useSession } from './use-session';
import { LoadingState } from '../../components/molecules/LoadingState';

/** Protege las rutas internas: sin sesión redirige al login. */
export function RequireSession() {
  const session = useSession();
  if (session.isPending) {
    return <LoadingState />;
  }
  if (!session.data) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

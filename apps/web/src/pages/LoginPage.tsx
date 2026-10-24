import { Navigate } from 'react-router';
import { LoginForm } from '../features/auth/LoginForm';
import { wasSessionExpired } from '../features/auth/session-state';
import { useSession } from '../features/auth/use-session';
import { useDocumentTitle } from '../lib/use-document-title';

export function LoginPage() {
  useDocumentTitle('Iniciar sesión');
  const session = useSession();
  const expired = wasSessionExpired();
  if (session.data) {
    return <Navigate to="/" replace />;
  }
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold">CEDI Control</h1>
        <p className="mb-6 text-sm text-slate-600">Ingreso y salida de personal externo</p>
        {expired && (
          <p
            role="status"
            className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"
          >
            Tu sesión terminó. Inicia sesión de nuevo para continuar.
          </p>
        )}
        <LoginForm />
      </div>
    </main>
  );
}

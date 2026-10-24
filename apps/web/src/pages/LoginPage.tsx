import { Navigate } from 'react-router';
import { Icon, Logo } from '../components/atoms/Icon';
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
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-card border border-line bg-surface p-8 shadow-card">
        <div className="mb-6 flex items-center gap-3">
          <Logo className="h-10 w-10" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink">CEDI Control</h1>
            <p className="text-sm text-ink-muted">Ingreso y salida de personal externo</p>
          </div>
        </div>
        {expired && (
          <p
            role="status"
            className="mb-4 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning-soft px-3 py-2 text-sm text-warning-strong"
          >
            <Icon name="alert" className="mt-0.5 h-4 w-4" />
            Tu sesión terminó. Inicia sesión de nuevo para continuar.
          </p>
        )}
        <LoginForm />
      </div>
    </main>
  );
}

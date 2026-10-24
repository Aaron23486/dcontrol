import { Link } from 'react-router';
import { EmptyState } from '../components/molecules/EmptyState';
import { useDocumentTitle } from '../lib/use-document-title';

export function NotFoundPage() {
  useDocumentTitle('Página no encontrada');
  return (
    <section className="mx-auto max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Página no encontrada</h1>
      <EmptyState
        action={
          <Link to="/" className="font-medium text-slate-900 underline">
            Volver a ingreso y salida
          </Link>
        }
      >
        La dirección no existe o cambió.
      </EmptyState>
    </section>
  );
}

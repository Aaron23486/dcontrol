import { ButtonLink } from '../components/atoms/Button';
import { EmptyState } from '../components/molecules/EmptyState';
import { PageHeader } from '../components/molecules/PageHeader';
import { useDocumentTitle } from '../lib/use-document-title';

export function NotFoundPage() {
  useDocumentTitle('Página no encontrada');
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PageHeader title="Página no encontrada" />
      <EmptyState action={<ButtonLink to="/">Volver a ingreso y salida</ButtonLink>}>
        La dirección no existe o cambió.
      </EmptyState>
    </div>
  );
}

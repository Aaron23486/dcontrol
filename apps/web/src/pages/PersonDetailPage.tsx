import {
  PERSON_TYPE_LABEL,
  Role,
  canCorrectPersonIdentity,
  type PersonData,
  type UpdatePersonInput,
} from '@cedi/shared';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Badge } from '../components/atoms/Badge';
import { ConfirmDialog } from '../components/molecules/ConfirmDialog';
import { useSession } from '../features/auth/use-session';
import { PersonForm } from '../features/persons/PersonForm';
import { VisitHistory } from '../features/persons/VisitHistory';
import { changesBetween, formValuesOf } from '../features/persons/person-changes';
import { sectionByType } from '../features/persons/person-sections';
import { usePersonDetail, useUpdatePerson } from '../features/persons/use-persons';
import { ErrorState } from '../components/molecules/ErrorState';
import { LoadingState } from '../components/molecules/LoadingState';
import { useDocumentTitle } from '../lib/use-document-title';

export function PersonDetailPage() {
  useDocumentTitle('Ficha de persona');
  const id = useParams().id ?? '';
  const { data: user } = useSession();
  const detail = usePersonDetail(id);
  const update = useUpdatePerson(id);
  const [pendingChanges, setPendingChanges] = useState<UpdatePersonInput | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (detail.isPending) return <LoadingState />;
  if (detail.error) {
    return <ErrorState message={detail.error.message} onRetry={() => void detail.refetch()} />;
  }
  const person = detail.data;
  const section = sectionByType(person.type);

  const save = (changes: UpdatePersonInput) =>
    update.mutate(changes, { onSuccess: () => setNotice('Cambios guardados.') });

  const onSubmit = (values: PersonData) => {
    setNotice(null);
    const changes = changesBetween(person, values);
    if (Object.keys(changes).length === 0) return setNotice('No hay cambios para guardar.');
    // D13: el cambio de tipo cambia qué datos se piden en sus próximas visitas; se confirma.
    if (changes.type) return setPendingChanges(changes);
    save(changes);
  };

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <Link to={`/personas/${section.slug}`} className="text-sm text-slate-600 hover:underline">
        ← {section.title}
      </Link>
      <header className="flex flex-wrap items-center gap-3">
        {user?.role === Role.ADMIN && (
          <Link
            to={`/auditoria?range=all&entityId=${person.id}`}
            className="order-last w-full text-sm text-slate-600 hover:underline"
          >
            Ver auditoría de esta persona
          </Link>
        )}
        <h1 className="text-xl font-semibold">{person.fullName}</h1>
        {person.isInside ? <Badge tone="success">Dentro</Badge> : <Badge>Fuera</Badge>}
        <span className="text-sm text-slate-500">
          Cédula <span className="font-mono">{person.identification}</span> ·{' '}
          {PERSON_TYPE_LABEL[person.type]} · {person.company.name}
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold">Datos</h2>
          {notice && (
            <p className="mb-4 text-sm text-emerald-700" role="status">
              {notice}
            </p>
          )}
          <PersonForm
            key={`${person.type}-${person.company.id}-${person.fullName}-${person.identification}`}
            defaultValues={formValuesOf(person)}
            initialCompany={person.company}
            lockIdentity={!user || !canCorrectPersonIdentity(user.role)}
            submitLabel="Guardar cambios"
            pending={update.isPending}
            error={update.error?.message}
            onSubmit={onSubmit}
          />
        </div>
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-semibold">Visitas recientes</h2>
            <Link
              to={`/historial/${section.slug}?range=all&q=${person.identification}`}
              className="text-sm text-slate-600 hover:underline"
            >
              Ver historial completo
            </Link>
          </div>
          <VisitHistory visits={person.visits} />
        </div>
      </div>

      <ConfirmDialog
        open={pendingChanges !== null}
        title="¿Cambiar el tipo de persona?"
        confirmLabel="Sí, cambiar"
        onCancel={() => setPendingChanges(null)}
        onConfirm={() => {
          if (pendingChanges) save(pendingChanges);
          setPendingChanges(null);
        }}
      >
        {pendingChanges?.type && (
          <>
            Pasará de <strong>{PERSON_TYPE_LABEL[person.type]}</strong> a{' '}
            <strong>{PERSON_TYPE_LABEL[pendingChanges.type]}</strong>. Sus próximas visitas pedirán
            los datos de ese tipo; las visitas anteriores no cambian.
          </>
        )}
      </ConfirmDialog>
    </section>
  );
}

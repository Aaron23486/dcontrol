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
import { Icon } from '../components/atoms/Icon';
import { BackLink } from '../components/molecules/BackLink';
import { Card } from '../components/molecules/Card';
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

const TEXT_LINK =
  'inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-primary-strong hover:underline';

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
    <div className="space-y-4">
      <BackLink to={`/personas/${section.slug}`}>{section.title}</BackLink>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-ink">{person.fullName}</h1>
            {person.isInside ? <Badge tone="success">Dentro</Badge> : <Badge>Fuera</Badge>}
          </div>
          <p className="text-sm text-ink-muted">
            Cédula <span className="font-mono text-ink-soft">{person.identification}</span> ·{' '}
            {PERSON_TYPE_LABEL[person.type]} · {person.company.name}
          </p>
        </div>
        {user?.role === Role.ADMIN && (
          <Link to={`/auditoria?range=all&entityId=${person.id}`} className={TEXT_LINK}>
            <Icon name="shield" className="h-4 w-4" />
            Ver auditoría de esta persona
          </Link>
        )}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <Card title="Datos" icon="user" bodyClassName="px-4 pb-4">
          {notice && (
            <p className="mb-4 text-sm font-medium text-success-strong" role="status">
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
        </Card>
        <Card
          title="Visitas recientes"
          icon="history"
          action={
            <Link
              to={`/historial/${section.slug}?range=all&q=${person.identification}`}
              className={TEXT_LINK}
            >
              Ver historial completo
              <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          }
          bodyClassName="px-4 pb-4"
        >
          <VisitHistory visits={person.visits} />
        </Card>
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
    </div>
  );
}

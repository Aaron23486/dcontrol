import { PERSON_TYPE_LABEL, type PersonSummary } from '@cedi/shared';
import { Badge } from '../../components/atoms/Badge';
import { Icon } from '../../components/atoms/Icon';

/** Ficha de la persona que se muestra al ingresar su cédula (FR-5). */
export function PersonCard({ person }: { person: PersonSummary }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Icon name="user" className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-lg font-bold text-ink">{person.fullName}</span>
          {person.isInside ? <Badge tone="success">Dentro</Badge> : <Badge>Fuera</Badge>}
        </div>
        <p className="text-sm text-ink-muted">
          Cédula <span className="font-mono text-ink-soft">{person.identification}</span> ·{' '}
          {PERSON_TYPE_LABEL[person.type]} · {person.company.name}
        </p>
      </div>
    </div>
  );
}

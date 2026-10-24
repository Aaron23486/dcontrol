import { PERSON_TYPE_LABEL, type PersonSummary } from '@cedi/shared';
import { Badge } from '../../components/atoms/Badge';

/** Ficha de la persona que se muestra al ingresar su cédula (spec §10). */
export function PersonCard({ person }: { person: PersonSummary }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="text-lg font-semibold">{person.fullName}</span>
      {person.isInside ? <Badge tone="success">Dentro</Badge> : <Badge>Fuera</Badge>}
      <span className="w-full text-sm text-slate-600">
        Cédula <span className="font-mono">{person.identification}</span> ·{' '}
        {PERSON_TYPE_LABEL[person.type]} · {person.company.name}
      </span>
    </div>
  );
}

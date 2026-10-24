import { Link, useNavigate, useParams } from 'react-router';
import { PersonForm } from '../features/persons/PersonForm';
import { DEFAULT_SECTION, sectionBySlug } from '../features/persons/person-sections';
import { useCreatePerson } from '../features/persons/use-persons';
import { useDocumentTitle } from '../lib/use-document-title';

export function NewPersonPage() {
  useDocumentTitle('Registrar persona');
  const section = sectionBySlug(useParams().section) ?? DEFAULT_SECTION;
  const navigate = useNavigate();
  const create = useCreatePerson();

  return (
    <section className="mx-auto max-w-lg space-y-4">
      <Link to={`/personas/${section.slug}`} className="text-sm text-slate-600 hover:underline">
        ← {section.title}
      </Link>
      <h1 className="text-xl font-semibold">Registrar persona</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <PersonForm
          defaultValues={{ type: section.type }}
          submitLabel="Registrar"
          pending={create.isPending}
          error={create.error?.message}
          onSubmit={(values) =>
            create.mutate(values, {
              onSuccess: (person) => navigate(`/personas/detalle/${person.id}`),
            })
          }
        />
      </div>
    </section>
  );
}

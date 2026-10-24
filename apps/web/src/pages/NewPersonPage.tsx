import { useNavigate, useParams } from 'react-router';
import { BackLink } from '../components/molecules/BackLink';
import { Card } from '../components/molecules/Card';
import { PageHeader } from '../components/molecules/PageHeader';
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
    <div className="mx-auto max-w-3xl space-y-4">
      <BackLink to={`/personas/${section.slug}`}>{section.title}</BackLink>
      <PageHeader
        title="Registrar persona"
        description="La entrada se registra después, al ingresar su cédula en la caseta."
        icon="userPlus"
      />
      <Card bodyClassName="p-6">
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
      </Card>
    </div>
  );
}

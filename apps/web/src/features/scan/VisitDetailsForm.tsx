import {
  PersonType,
  VISIT_FIELDS_BY_TYPE,
  visitDetailsSchema,
  type EntryPrefill,
  type VisitDetails,
} from '@cedi/shared';
import { useFieldArray, useForm } from 'react-hook-form';
import { Alert } from '../../components/atoms/Alert';
import { Button } from '../../components/atoms/Button';
import { Icon } from '../../components/atoms/Icon';
import { Input } from '../../components/atoms/Input';
import { FormField } from '../../components/molecules/FormField';
import { toVisitDetailsInput, type VisitDetailsFormValues } from './visit-details-input';

interface VisitDetailsFormProps {
  personType: PersonType;
  prefill: EntryPrefill | null;
  submitLabel: string;
  pending: boolean;
  error?: string;
  onSubmit: (details: VisitDetails) => void;
  onCancel: () => void;
}

/** Datos de la visita que corresponden al tipo de persona (FR-2). */
export function VisitDetailsForm({
  personType,
  prefill,
  submitLabel,
  pending,
  error,
  onSubmit,
  onCancel,
}: VisitDetailsFormProps) {
  const fields: readonly string[] = VISIT_FIELDS_BY_TYPE[personType];
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<VisitDetailsFormValues>({
    defaultValues: {
      purpose: prefill?.purpose ?? '',
      area: prefill?.area ?? '',
      tools: [],
    },
  });
  const tools = useFieldArray({ control, name: 'tools' });

  // Valida con el esquema compartido, el mismo que aplica la API (R18, R19).
  const submit = (values: VisitDetailsFormValues) => {
    const parsed = visitDetailsSchema.safeParse(toVisitDetailsInput(personType, values));
    if (parsed.success) return onSubmit(parsed.data);
    for (const issue of parsed.error.issues) {
      const [field] = issue.path;
      if (field === 'purpose' || field === 'area') setError(field, { message: issue.message });
      else setError('root.tools', { message: issue.message });
    }
  };

  return (
    <form noValidate className="@container space-y-4" onSubmit={handleSubmit(submit)}>
      {error && <Alert>{error}</Alert>}
      {fields.includes('purpose') && (
        <p className="text-xs text-ink-muted">Motivo y área son obligatorios.</p>
      )}
      <div className="grid gap-4 @lg:grid-cols-2">
        {fields.includes('purpose') && (
          <FormField label="Motivo" error={errors.purpose?.message}>
            <Input autoComplete="off" autoFocus {...register('purpose')} />
          </FormField>
        )}
        {fields.includes('area') && (
          <FormField
            label={personType === PersonType.VISITOR ? 'Área que visita' : 'Área'}
            error={errors.area?.message}
          >
            <Input autoComplete="off" {...register('area')} />
          </FormField>
        )}
      </div>
      {fields.includes('tools') && (
        <fieldset className="space-y-2 rounded-lg border border-line p-4">
          <legend className="px-1 text-sm font-semibold text-ink-soft">
            Herramientas o equipos (opcional)
          </legend>
          {tools.fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-[1fr_1fr_5rem_auto] gap-2">
              <Input
                aria-label={`Herramienta ${index + 1}`}
                placeholder="Herramienta"
                {...register(`tools.${index}.name`)}
              />
              <Input
                aria-label={`Descripción de la herramienta ${index + 1}`}
                placeholder="Descripción"
                {...register(`tools.${index}.description`)}
              />
              <Input
                aria-label={`Cantidad de la herramienta ${index + 1}`}
                placeholder="Cant."
                inputMode="numeric"
                {...register(`tools.${index}.quantity`)}
              />
              <Button
                variant="secondary"
                aria-label={`Quitar herramienta ${index + 1}`}
                className="px-3"
                onClick={() => tools.remove(index)}
              >
                <Icon name="close" className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {errors.root?.tools?.message && (
            <p className="text-sm text-danger-strong">{errors.root.tools.message}</p>
          )}
          <Button
            variant="secondary"
            onClick={() => tools.append({ name: '', description: '', quantity: '' })}
          >
            <Icon name="plus" className="h-4 w-4" />
            Agregar herramienta
          </Button>
        </fieldset>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" disabled={pending} autoFocus={fields.length === 0}>
          {pending ? 'Registrando…' : submitLabel}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

import { zodResolver } from '@hookform/resolvers/zod';
import {
  PERSON_TYPES,
  PERSON_TYPE_LABEL,
  normalizeIdentification,
  personSchema,
  type CompanySummary,
  type PersonData,
} from '@cedi/shared';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Alert } from '../../components/atoms/Alert';
import { Button } from '../../components/atoms/Button';
import { Input } from '../../components/atoms/Input';
import { Select } from '../../components/atoms/Select';
import { FormField } from '../../components/molecules/FormField';
import { CompanyCombobox } from '../companies/CompanyCombobox';
import type { PersonFormValues } from './person-changes';

interface PersonFormProps {
  defaultValues: Partial<PersonFormValues>;
  initialCompany?: CompanySummary;
  /** Nombre y cédula solo de lectura (Seguridad no los corrige, D13). */
  lockIdentity?: boolean;
  submitLabel: string;
  pending: boolean;
  error?: string;
  /** Recibe los valores ya validados y normalizados con personSchema. */
  onSubmit: (values: PersonData) => void;
}

/**
 * Datos de la persona, iguales para los cuatro tipos (FR-2). Todos son obligatorios.
 * En dos columnas cuando el formulario tiene espacio (consulta de contenedor), en una si no.
 */
export function PersonForm({
  defaultValues,
  initialCompany,
  lockIdentity = false,
  submitLabel,
  pending,
  error,
  onSubmit,
}: PersonFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonFormValues, unknown, PersonData>({
    resolver: zodResolver(personSchema),
    defaultValues,
  });
  const identification = useWatch({ control, name: 'identification' }) ?? '';
  const normalized = normalizeIdentification(identification);
  const lockHint = lockIdentity ? 'Solo un administrador puede corregirlo.' : undefined;

  return (
    <form noValidate className="@container space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {error && <Alert>{error}</Alert>}
      <p className="text-xs text-ink-muted">Todos los datos son obligatorios.</p>
      <div className="grid gap-4 @lg:grid-cols-2">
        <FormField label="Nombre completo" error={errors.fullName?.message}>
          <Input
            autoComplete="off"
            readOnly={lockIdentity}
            title={lockHint}
            // Al registrar a alguien nuevo se empieza por el nombre; al editar no se fuerza el foco.
            autoFocus={!defaultValues.fullName}
            {...register('fullName')}
          />
        </FormField>
        <div className="space-y-1.5">
          <FormField label="Cédula" error={errors.identification?.message}>
            <Input
              autoComplete="off"
              inputMode="text"
              readOnly={lockIdentity}
              title={lockHint}
              {...register('identification')}
            />
          </FormField>
          {!lockIdentity && normalized && normalized !== identification && (
            <p className="text-xs text-ink-muted">
              Se guardará como <span className="font-mono">{normalized}</span>
            </p>
          )}
        </div>
        {lockHint && (
          <p className="-mt-2 text-xs text-ink-muted @lg:col-span-2">Nombre y cédula: {lockHint}</p>
        )}
        <FormField label="Tipo de persona" error={errors.type?.message}>
          <Select {...register('type')}>
            {/* Sin tipo predefinido, el guarda debe elegirlo: evita registrar el tipo equivocado. */}
            {!defaultValues.type && <option value="">Selecciona el tipo</option>}
            {PERSON_TYPES.map((type) => (
              <option key={type} value={type}>
                {PERSON_TYPE_LABEL[type]}
              </option>
            ))}
          </Select>
        </FormField>
        <Controller
          control={control}
          name="companyId"
          render={({ field, fieldState }) => (
            <FormField label="Empresa" error={fieldState.error?.message}>
              <CompanyCombobox
                value={initialCompany ?? null}
                onChange={(company) => field.onChange(company.id)}
              />
            </FormField>
          )}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'Guardando…' : submitLabel}
      </Button>
    </form>
  );
}

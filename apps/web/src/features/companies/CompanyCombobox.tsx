import type { CompanySummary } from '@cedi/shared';
import { useId, useState, type KeyboardEvent } from 'react';
import { Input } from '../../components/atoms/Input';
import { canOfferNewCompany, useCompanySearch, useCreateCompany } from './use-companies';

interface CompanyComboboxProps {
  value: CompanySummary | null;
  onChange: (company: CompanySummary) => void;
  id?: string;
  'aria-describedby'?: string;
  invalid?: boolean;
}

type Option = { kind: 'company'; company: CompanySummary } | { kind: 'create'; name: string };

/** Autocompletado de empresas con opción de crear una nueva sin salir del formulario. */
export function CompanyCombobox({ value, onChange, invalid, ...aria }: CompanyComboboxProps) {
  const listId = useId();
  const [text, setText] = useState(value?.name ?? '');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const { companies, isStale } = useCompanySearch(text, open);
  const createCompany = useCreateCompany();

  const options: Option[] = isStale
    ? []
    : [
        ...companies.map((company) => ({ kind: 'company' as const, company })),
        ...(canOfferNewCompany(text, companies)
          ? [{ kind: 'create' as const, name: text.trim() }]
          : []),
      ];

  const choose = async (option: Option) => {
    const company =
      option.kind === 'company' ? option.company : await createCompany.mutateAsync(option.name);
    onChange(company);
    setText(company.name);
    setOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((current) => (current + step + options.length) % Math.max(options.length, 1));
    } else if (event.key === 'Enter' && open && options[active]) {
      event.preventDefault();
      void choose(options[active]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <Input
        {...aria}
        invalid={invalid}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && options[active] ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder="Escribe para buscar o crear"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      {open && isStale && (
        <p className="absolute z-10 mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-muted shadow-lg">
          Buscando…
        </p>
      )}
      {open && options.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-line bg-surface py-1 text-sm text-ink shadow-lg"
        >
          {options.map((option, index) => (
            <li
              key={option.kind === 'company' ? option.company.id : 'create'}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              // mousedown en lugar de click: ocurre antes del blur del input.
              onMouseDown={(event) => {
                event.preventDefault();
                void choose(option);
              }}
              className={`cursor-pointer px-3 py-2 ${index === active ? 'bg-primary-soft text-primary-strong' : ''}`}
            >
              {option.kind === 'company' ? option.company.name : `Crear empresa «${option.name}»`}
            </li>
          ))}
        </ul>
      )}
      {createCompany.error && (
        <p className="mt-1 text-sm text-danger-strong">{createCompany.error.message}</p>
      )}
    </div>
  );
}

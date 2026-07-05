import {
  BRAZILIAN_STATE_CODES,
  CLIENT_SEGMENTS,
  formatCnpj,
  type ClientFormValues,
} from '@/features/clients/api'

function FieldLabel({
  htmlFor,
  children,
  optional = false,
}: {
  htmlFor: string
  children: string
  optional?: boolean
}) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-foreground">
      {children}
      {optional && (
        <span className="font-normal text-muted-foreground"> (opcional)</span>
      )}
    </label>
  )
}

const inputClassName =
  'w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground focus:border-red-500'

export function ClientFormFields({
  idPrefix,
  form,
  onChange,
}: {
  idPrefix: string
  form: ClientFormValues
  onChange: (patch: Partial<ClientFormValues>) => void
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/80 bg-background/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Identificação
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <FieldLabel htmlFor={`${idPrefix}-legalName`}>Razão social</FieldLabel>
            <input
              id={`${idPrefix}-legalName`}
              type="text"
              required
              value={form.legalName}
              onChange={(event) => onChange({ legalName: event.target.value })}
              placeholder="Ex.: Construtora Exemplo Locação Ltda."
              className={inputClassName}
            />
          </div>

          <div>
            <FieldLabel htmlFor={`${idPrefix}-name`}>Nome fantasia</FieldLabel>
            <input
              id={`${idPrefix}-name`}
              type="text"
              required
              value={form.name}
              onChange={(event) => onChange({ name: event.target.value })}
              placeholder="Ex.: Construtora Exemplo"
              className={inputClassName}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor={`${idPrefix}-cnpj`}>CNPJ</FieldLabel>
              <input
                id={`${idPrefix}-cnpj`}
                type="text"
                inputMode="numeric"
                value={form.cnpj}
                onChange={(event) =>
                  onChange({ cnpj: formatCnpj(event.target.value) })
                }
                placeholder="00.000.000/0000-00"
                className={inputClassName}
              />
            </div>

            <div>
              <FieldLabel htmlFor={`${idPrefix}-internalCode`} optional>
                Código interno
              </FieldLabel>
              <input
                id={`${idPrefix}-internalCode`}
                type="text"
                value={form.internalCode}
                onChange={(event) => onChange({ internalCode: event.target.value })}
                placeholder="Ex.: CLI-0042"
                className={inputClassName}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor={`${idPrefix}-stateRegistration`} optional>
                Inscrição estadual
              </FieldLabel>
              <input
                id={`${idPrefix}-stateRegistration`}
                type="text"
                value={form.stateRegistration}
                onChange={(event) =>
                  onChange({ stateRegistration: event.target.value })
                }
                className={inputClassName}
              />
            </div>

            <div>
              <FieldLabel htmlFor={`${idPrefix}-segment`} optional>
                Segmento
              </FieldLabel>
              <select
                id={`${idPrefix}-segment`}
                value={form.segment}
                onChange={(event) => onChange({ segment: event.target.value })}
                className={inputClassName}
              >
                <option value="">Selecione...</option>
                {CLIENT_SEGMENTS.map((segment) => (
                  <option key={segment} value={segment}>
                    {segment}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-background/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Contato
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <FieldLabel htmlFor={`${idPrefix}-contactName`} optional>
              Responsável principal
            </FieldLabel>
            <input
              id={`${idPrefix}-contactName`}
              type="text"
              value={form.contactName}
              onChange={(event) => onChange({ contactName: event.target.value })}
              placeholder="Nome do contato comercial"
              className={inputClassName}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor={`${idPrefix}-contactEmail`} optional>
                E-mail comercial
              </FieldLabel>
              <input
                id={`${idPrefix}-contactEmail`}
                type="email"
                value={form.contactEmail}
                onChange={(event) => onChange({ contactEmail: event.target.value })}
                placeholder="contato@empresa.com.br"
                className={inputClassName}
              />
            </div>

            <div>
              <FieldLabel htmlFor={`${idPrefix}-contactPhone`} optional>
                Telefone comercial
              </FieldLabel>
              <input
                id={`${idPrefix}-contactPhone`}
                type="tel"
                value={form.contactPhone}
                onChange={(event) => onChange({ contactPhone: event.target.value })}
                placeholder="(00) 00000-0000"
                className={inputClassName}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-background/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Localização
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_120px]">
          <div>
            <FieldLabel htmlFor={`${idPrefix}-city`} optional>
              Cidade
            </FieldLabel>
            <input
              id={`${idPrefix}-city`}
              type="text"
              value={form.city}
              onChange={(event) => onChange({ city: event.target.value })}
              placeholder="Ex.: São Paulo"
              className={inputClassName}
            />
          </div>

          <div>
            <FieldLabel htmlFor={`${idPrefix}-stateCode`} optional>
              UF
            </FieldLabel>
            <select
              id={`${idPrefix}-stateCode`}
              value={form.stateCode}
              onChange={(event) => onChange({ stateCode: event.target.value })}
              className={inputClassName}
            >
              <option value="">UF</option>
              {BRAZILIAN_STATE_CODES.map((stateCode) => (
                <option key={stateCode} value={stateCode}>
                  {stateCode}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <FieldLabel htmlFor={`${idPrefix}-notes`} optional>
          Observações internas
        </FieldLabel>
        <textarea
          id={`${idPrefix}-notes`}
          rows={3}
          value={form.notes}
          onChange={(event) => onChange({ notes: event.target.value })}
          placeholder="Informações visíveis apenas para a equipe ADM..."
          className={`${inputClassName} resize-none`}
        />
      </div>
    </div>
  )
}

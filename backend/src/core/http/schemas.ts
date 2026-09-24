import * as z from 'zod';

export const uuidParamsSchema = z.object({
  id: z.uuid(),
});

// Instante com fuso explícito (ISO 8601), convertido para Date na borda.
export const isoInstantSchema = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value));

// Nomes de pessoas envolvidas; texto livre, sem vínculo com usuários.
export const peoplesSchema = z.array(z.string().trim().min(1).max(100)).max(50);

export function hasAnyField(body: Record<string, unknown>): boolean {
  return Object.values(body).some((value) => value !== undefined);
}

export const ANY_FIELD_MESSAGE = 'Informe ao menos um campo para atualizar';

interface TimeRange {
  startTime?: Date | null | undefined;
  endTime?: Date | null | undefined;
}

// Só compara quando os dois extremos vêm no mesmo corpo; em atualizações
// parciais, o service compara com o valor persistido.
export function endNotBeforeStart(range: TimeRange): boolean {
  if (!range.startTime || !range.endTime) {
    return true;
  }

  return range.endTime.getTime() >= range.startTime.getTime();
}

export const TIME_RANGE_MESSAGE = 'O término não pode ser anterior ao início';

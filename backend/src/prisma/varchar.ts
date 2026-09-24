import type { Varchar } from '@prisma/orm-postgres/target/codec-types';

// Colunas VarChar(n) são strings com marca de tipo no Prisma 8. O limite já é
// validado pelos schemas Zod na borda; a checagem aqui só protege contra um
// schema desalinhado com o contrato, que viraria erro interno em vez de dado
// truncado ou rejeitado pelo banco.
export function varchar<N extends number>(value: string, max: N): Varchar<N> {
  if (value.length > max) {
    throw new Error(`Valor excede VarChar(${max})`);
  }

  return value as Varchar<N>;
}

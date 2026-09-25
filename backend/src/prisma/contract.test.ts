import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface Column {
  codecId: string;
  default?: { kind: string; value?: unknown };
}

interface ContractJson {
  storage: {
    namespaces: {
      public: {
        entries: { table: Record<string, { columns: Record<string, Column> }> };
      };
    };
  };
}

const contract = JSON.parse(
  readFileSync(new URL('./contract.json', import.meta.url), 'utf8'),
) as ContractJson;

describe('contract.json', () => {
  // O planejador de migrações do Prisma 8 RC recusa `Numeric @default(0)`
  // ("pg/numeric@1 database JSON value must be a decimal string"), e o literal
  // em string não passa na verificação do banco, que devolve o default como
  // função. Por isso o contrato usa `dbgenerated` em colunas numéricas.
  it('não usa default literal em colunas numeric', () => {
    const offenders = Object.entries(
      contract.storage.namespaces.public.entries.table,
    )
      .flatMap(([table, { columns }]) =>
        Object.entries(columns).map(([name, column]) => ({
          table,
          name,
          column,
        })),
      )
      .filter(
        ({ column }) =>
          column.codecId === 'pg/numeric@1' &&
          column.default?.kind === 'literal',
      )
      .map(({ table, name }) => `${table}.${name}`);

    expect(offenders).toEqual([]);
  });
});

# Regra 03: Governança do Prisma ORM e Banco de Dados

- **Prisma 8 ORM RC:**
  - O projeto utiliza Prisma 8 RC com emissão de contratos.
  - O contrato canonical de tipos é definido em `backend/src/prisma/contract.prisma`.
- **Emissão do Contrato:**
  - Sempre que o arquivo `contract.prisma` for alterado sob solicitação explícita do usuário, deve-se executar `npm --prefix backend run contract:emit` para atualizar os artefatos `contract.d.ts` e `contract.json`.
- **Segurança de Banco de Dados:**
  - Nenhuma operação de leitura/escrita direta em banco de dados de produção ou execução de migrações (`prisma migrate`) pode ser realizada de forma implícita. Exige autorização explícita e destacada do usuário.

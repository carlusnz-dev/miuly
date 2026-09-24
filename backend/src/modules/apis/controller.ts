import { BaseController } from '../../core/base';
import { handler, paginatedHandler } from '../../core/http/handler';
import {
  apiIdParamsSchema,
  createApiBodySchema,
  listApisQuerySchema,
  toApiConnectionResponse,
  updateApiBodySchema,
} from './contract';
import type { ApiConnectionService } from './service';

export class ApiConnectionController extends BaseController<ApiConnectionService> {
  list = paginatedHandler({
    auth: true,
    schemas: { query: listApisQuerySchema },
    message: 'Conexões encontradas',
    execute: ({ auth, query }) => this.service.list(auth.profileId, query),
    present: toApiConnectionResponse,
  });

  findById = handler({
    auth: true,
    schemas: { params: apiIdParamsSchema },
    message: 'Conexão encontrada',
    execute: ({ auth, params }) =>
      this.service.findById(auth.profileId, params.id),
    present: toApiConnectionResponse,
  });

  create = handler({
    auth: true,
    schemas: { body: createApiBodySchema },
    status: 201,
    message: 'Conexão criada',
    execute: ({ auth, body }) => this.service.create(auth.profileId, body),
    present: toApiConnectionResponse,
  });

  update = handler({
    auth: true,
    schemas: { params: apiIdParamsSchema, body: updateApiBodySchema },
    message: 'Conexão atualizada',
    execute: ({ auth, params, body }) =>
      this.service.update(auth.profileId, params.id, body),
    present: toApiConnectionResponse,
  });

  delete = handler({
    auth: true,
    schemas: { params: apiIdParamsSchema },
    message: 'Conexão removida',
    execute: ({ auth, params }) =>
      this.service.delete(auth.profileId, params.id),
    present: () => null,
  });
}

import { BaseController } from '../../core/base';
import { handler, paginatedHandler } from '../../core/http/handler';
import {
  createTaskBodySchema,
  listTasksQuerySchema,
  taskIdParamsSchema,
  toTaskResponse,
  updateTaskBodySchema,
} from './contract';
import type { TaskService } from './service';

export class TaskController extends BaseController<TaskService> {
  list = paginatedHandler({
    auth: true,
    schemas: { query: listTasksQuerySchema },
    message: 'Tarefas encontradas',
    execute: ({ auth, query }) => this.service.list(auth.profileId, query),
    present: toTaskResponse,
  });

  findById = handler({
    auth: true,
    schemas: { params: taskIdParamsSchema },
    message: 'Tarefa encontrada',
    execute: ({ auth, params }) =>
      this.service.findById(auth.profileId, params.id),
    present: toTaskResponse,
  });

  create = handler({
    auth: true,
    schemas: { body: createTaskBodySchema },
    status: 201,
    message: 'Tarefa criada',
    execute: ({ auth, body }) => this.service.create(auth.profileId, body),
    present: toTaskResponse,
  });

  update = handler({
    auth: true,
    schemas: { params: taskIdParamsSchema, body: updateTaskBodySchema },
    message: 'Tarefa atualizada',
    execute: ({ auth, params, body }) =>
      this.service.update(auth.profileId, params.id, body),
    present: toTaskResponse,
  });

  delete = handler({
    auth: true,
    schemas: { params: taskIdParamsSchema },
    message: 'Tarefa removida',
    execute: ({ auth, params }) =>
      this.service.delete(auth.profileId, params.id),
    present: () => null,
  });
}

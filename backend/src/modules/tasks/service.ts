import { BaseService } from '../../core/base';
import { BadRequestError, NotFoundError } from '../../core/error';
import { endNotBeforeStart, TIME_RANGE_MESSAGE } from '../../core/http/schemas';
import type { Page } from '../../core/types/pagination';
import type {
  CreateTaskInput,
  ListTasksQuery,
  Task,
  UpdateTaskInput,
} from './contract';
import type { TaskFilter, TaskRepository } from './repository';

// Contrato público do service de tarefas.
export interface TaskService {
  list(profileId: string, query: ListTasksQuery): Promise<Page<Task>>;
  findById(profileId: string, id: string): Promise<Task>;
  create(profileId: string, input: CreateTaskInput): Promise<Task>;
  update(profileId: string, id: string, input: UpdateTaskInput): Promise<Task>;
  delete(profileId: string, id: string): Promise<void>;
}

const NOT_FOUND = 'Tarefa não encontrada';

export class TaskServiceImpl
  extends BaseService<TaskRepository>
  implements TaskService
{
  list(profileId: string, query: ListTasksQuery): Promise<Page<Task>> {
    const filter: TaskFilter = { page: query.page, pageSize: query.pageSize };

    if (query.done !== undefined) filter.done = query.done;
    if (query.priority !== undefined) filter.priority = query.priority;
    if (query.from !== undefined) filter.from = query.from;
    if (query.to !== undefined) filter.to = query.to;

    return this.repository.list(profileId, filter);
  }

  async findById(profileId: string, id: string): Promise<Task> {
    const task = await this.repository.findById(profileId, id);

    if (!task) {
      throw new NotFoundError(NOT_FOUND);
    }

    return task;
  }

  create(profileId: string, input: CreateTaskInput): Promise<Task> {
    return this.repository.create(profileId, input);
  }

  async update(
    profileId: string,
    id: string,
    input: UpdateTaskInput,
  ): Promise<Task> {
    // Com só um extremo no corpo, o intervalo é validado contra o salvo.
    if (input.startTime !== undefined || input.endTime !== undefined) {
      const current = await this.findById(profileId, id);
      const range = {
        startTime:
          input.startTime !== undefined ? input.startTime : current.startTime,
        endTime: input.endTime !== undefined ? input.endTime : current.endTime,
      };

      if (!endNotBeforeStart(range)) {
        throw new BadRequestError(TIME_RANGE_MESSAGE);
      }
    }

    const task = await this.repository.update(profileId, id, input);

    if (!task) {
      throw new NotFoundError(NOT_FOUND);
    }

    return task;
  }

  async delete(profileId: string, id: string): Promise<void> {
    const deleted = await this.repository.delete(profileId, id);

    if (!deleted) {
      throw new NotFoundError(NOT_FOUND);
    }
  }
}

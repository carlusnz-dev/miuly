import { BaseService } from '../../core/base';
import { BadRequestError, NotFoundError } from '../../core/error';
import { endNotBeforeStart, TIME_RANGE_MESSAGE } from '../../core/http/schemas';
import type { Page } from '../../core/types/pagination';
import type {
  ApiConnection,
  CreateApiInput,
  ListApisQuery,
  UpdateApiInput,
} from './contract';
import type { ApiConnectionRepository } from './repository';

// Contrato público do service de conexões com APIs externas.
export interface ApiConnectionService {
  list(profileId: string, query: ListApisQuery): Promise<Page<ApiConnection>>;
  findById(profileId: string, id: string): Promise<ApiConnection>;
  create(profileId: string, input: CreateApiInput): Promise<ApiConnection>;
  update(
    profileId: string,
    id: string,
    input: UpdateApiInput,
  ): Promise<ApiConnection>;
  delete(profileId: string, id: string): Promise<void>;
}

const NOT_FOUND = 'Conexão não encontrada';

export class ApiConnectionServiceImpl
  extends BaseService<ApiConnectionRepository>
  implements ApiConnectionService
{
  list(profileId: string, query: ListApisQuery): Promise<Page<ApiConnection>> {
    return this.repository.list(profileId, {
      page: query.page,
      pageSize: query.pageSize,
      ...(query.status !== undefined && { status: query.status }),
    });
  }

  async findById(profileId: string, id: string): Promise<ApiConnection> {
    const api = await this.repository.findById(profileId, id);

    if (!api) {
      throw new NotFoundError(NOT_FOUND);
    }

    return api;
  }

  create(profileId: string, input: CreateApiInput): Promise<ApiConnection> {
    return this.repository.create(profileId, input);
  }

  async update(
    profileId: string,
    id: string,
    input: UpdateApiInput,
  ): Promise<ApiConnection> {
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

    const api = await this.repository.update(profileId, id, input);

    if (!api) {
      throw new NotFoundError(NOT_FOUND);
    }

    return api;
  }

  async delete(profileId: string, id: string): Promise<void> {
    const deleted = await this.repository.delete(profileId, id);

    if (!deleted) {
      throw new NotFoundError(NOT_FOUND);
    }
  }
}

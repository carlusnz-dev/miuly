import { describe, expect, it, vi } from 'vitest';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../../core/error';
import { API_ID, makeApiConnection, PROFILE_ID } from './fixtures';
import type { ApiConnectionRepository } from './repository';
import { ApiConnectionServiceImpl, type ApiConnectionService } from './service';

function setup(overrides: Partial<ApiConnectionRepository> = {}) {
  const repository: ApiConnectionRepository = {
    list: vi.fn(async () => ({
      items: [makeApiConnection()],
      page: 1,
      pageSize: 20,
      total: 1,
    })),
    findById: vi.fn(async () => makeApiConnection()),
    create: vi.fn(async () => makeApiConnection()),
    update: vi.fn(async () => makeApiConnection()),
    delete: vi.fn(async () => true),
    ...overrides,
  };
  const service: ApiConnectionService = new ApiConnectionServiceImpl(
    repository,
  );

  return { service, repository };
}

describe('ApiConnectionServiceImpl', () => {
  it('list repassa perfil, paginação e filtro de status', async () => {
    const { service, repository } = setup();

    await service.list(PROFILE_ID, { page: 2, pageSize: 10, status: false });

    expect(repository.list).toHaveBeenCalledWith(PROFILE_ID, {
      page: 2,
      pageSize: 10,
      status: false,
    });
  });

  it('list não envia status quando o filtro está ausente', async () => {
    const { service, repository } = setup();

    await service.list(PROFILE_ID, { page: 1, pageSize: 20 });

    expect(repository.list).toHaveBeenCalledWith(PROFILE_ID, {
      page: 1,
      pageSize: 20,
    });
  });

  it('findById responde 404 para conexão inexistente ou de outro perfil', async () => {
    const { service } = setup({ findById: vi.fn(async () => null) });

    await expect(service.findById(PROFILE_ID, API_ID)).rejects.toThrow(
      NotFoundError,
    );
  });

  it('create propaga o conflito de título', async () => {
    const { service } = setup({
      create: vi.fn(async () => {
        throw new ConflictError('Já existe uma conexão com este título');
      }),
    });

    await expect(
      service.create(PROFILE_ID, {
        title: 'Google Calendar',
        urlBase: 'https://www.googleapis.com',
        slugUrl: 'google-calendar',
        peoples: [],
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('update sem datas não consulta o registro atual', async () => {
    const { service, repository } = setup();

    await service.update(PROFILE_ID, API_ID, { status: false });

    expect(repository.findById).not.toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith(PROFILE_ID, API_ID, {
      status: false,
    });
  });

  it('update rejeita início novo depois do término salvo', async () => {
    const { service, repository } = setup();

    await expect(
      service.update(PROFILE_ID, API_ID, {
        startTime: new Date('2026-09-24T13:00:00Z'),
      }),
    ).rejects.toThrow(BadRequestError);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('update aceita término novo compatível com o início salvo', async () => {
    const { service, repository } = setup();
    const endTime = new Date('2026-09-24T15:00:00Z');

    await service.update(PROFILE_ID, API_ID, { endTime });

    expect(repository.update).toHaveBeenCalledWith(PROFILE_ID, API_ID, {
      endTime,
    });
  });

  it('update aceita limpar o término', async () => {
    const { service } = setup();

    await expect(
      service.update(PROFILE_ID, API_ID, { endTime: null }),
    ).resolves.toBeDefined();
  });

  it('update responde 404 quando a conexão não existe', async () => {
    const { service } = setup({ update: vi.fn(async () => null) });

    await expect(
      service.update(PROFILE_ID, API_ID, { title: 'Outro' }),
    ).rejects.toThrow(NotFoundError);
  });

  it('delete responde 404 quando nada foi removido', async () => {
    const { service } = setup({ delete: vi.fn(async () => false) });

    await expect(service.delete(PROFILE_ID, API_ID)).rejects.toThrow(
      NotFoundError,
    );
  });
});

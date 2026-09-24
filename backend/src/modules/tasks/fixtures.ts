import type { Task } from './contract';

export const PROFILE_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
export const TASK_ID = '0f8fad5b-d9cb-469f-a165-70867728950e';

export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: TASK_ID,
    profileId: PROFILE_ID,
    title: 'Pagar boleto',
    observations: null,
    done: false,
    scheduledAt: new Date('2026-09-25T12:00:00Z'),
    priority: 'medium',
    startTime: new Date('2026-09-25T10:00:00Z'),
    endTime: new Date('2026-09-25T11:00:00Z'),
    peoples: [],
    tags: [],
    status: true,
    createdAt: new Date('2026-09-24T12:00:00Z'),
    updatedAt: new Date('2026-09-24T12:00:00Z'),
    ...overrides,
  };
}

const instant = (iso: string) => ({ epochMilliseconds: Date.parse(iso) });

export function makeTaskRow(overrides: Record<string, unknown> = {}) {
  return {
    id: TASK_ID,
    profileId: PROFILE_ID,
    title: 'Pagar boleto',
    observations: null,
    done: false,
    scheduledAt: instant('2026-09-25T12:00:00Z'),
    priority: 'urgent' as const,
    startTime: null,
    endTime: null,
    peoples: [],
    status: true,
    createdAt: instant('2026-09-24T12:00:00Z'),
    updatedAt: instant('2026-09-24T12:00:00Z'),
    tags: [{ id: 3, name: 'Casa', slugUrl: 'casa' }],
    ...overrides,
  };
}

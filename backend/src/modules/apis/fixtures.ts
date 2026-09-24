import type { ApiConnection } from './contract';

export const PROFILE_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
export const API_ID = '0f8fad5b-d9cb-469f-a165-70867728950e';

export function makeApiConnection(
  overrides: Partial<ApiConnection> = {},
): ApiConnection {
  return {
    id: API_ID,
    profileId: PROFILE_ID,
    title: 'Google Calendar',
    description: null,
    urlBase: 'https://www.googleapis.com',
    slugUrl: 'google-calendar',
    startTime: new Date('2026-09-24T10:00:00Z'),
    endTime: new Date('2026-09-24T12:00:00Z'),
    peoples: [],
    status: true,
    createdAt: new Date('2026-09-24T09:00:00Z'),
    updatedAt: new Date('2026-09-24T09:00:00Z'),
    ...overrides,
  };
}

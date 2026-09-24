import type { NextFunction, Request, Response } from 'express';
import { vi } from 'vitest';

export interface FakeResponse {
  statusCode: number;
  body: unknown;
  headersSent: boolean;
  status(code: number): FakeResponse;
  json(body: unknown): FakeResponse;
}

export function fakeResponse(): FakeResponse {
  return {
    statusCode: 200,
    body: undefined,
    headersSent: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

export function fakeRequest(overrides: Partial<Request> = {}): Request {
  return {
    method: 'GET',
    path: '/',
    originalUrl: '/',
    params: {},
    query: {},
    body: undefined,
    ...overrides,
  } as Request;
}

export function asResponse(res: FakeResponse): Response {
  return res as unknown as Response;
}

export function fakeNext(): NextFunction & ReturnType<typeof vi.fn> {
  return vi.fn() as NextFunction & ReturnType<typeof vi.fn>;
}

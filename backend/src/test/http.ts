import type { NextFunction, Request, Response } from 'express';
import { vi } from 'vitest';

export interface FakeCookie {
  name: string;
  value?: string;
  cleared: boolean;
  options: unknown;
}

export interface FakeResponse {
  statusCode: number;
  body: unknown;
  headersSent: boolean;
  headers: Record<string, string>;
  locals: Record<string, unknown>;
  cookies: FakeCookie[];
  status(code: number): FakeResponse;
  json(body: unknown): FakeResponse;
  cookie(name: string, value: string, options: unknown): FakeResponse;
  clearCookie(name: string, options: unknown): FakeResponse;
  setHeader(name: string, value: string): FakeResponse;
}

export function fakeResponse(): FakeResponse {
  return {
    statusCode: 200,
    body: undefined,
    headersSent: false,
    headers: {},
    locals: {},
    cookies: [],
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    cookie(name, value, options) {
      this.cookies.push({ name, value, cleared: false, options });
      return this;
    },
    clearCookie(name, options) {
      this.cookies.push({ name, cleared: true, options });
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
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
    headers: {},
    ...overrides,
  } as Request;
}

export function asResponse(res: FakeResponse): Response {
  return res as unknown as Response;
}

export function fakeNext(): NextFunction & ReturnType<typeof vi.fn> {
  return vi.fn() as NextFunction & ReturnType<typeof vi.fn>;
}

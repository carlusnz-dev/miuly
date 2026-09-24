import type { Request, RequestHandler, Response } from 'express';
import type * as z from 'zod';
import { UnauthorizedError } from '../error';
import type { AuthContext } from '../types/auth';
import type { Page } from '../types/pagination';
import type { PaginatedResponse, SuccessResponse } from '../types/response';
import { parseCookies, type CookieInstruction } from './cookies';
import { toPaginationMeta } from './pagination';

export interface RequestSchemas {
  params?: z.ZodType;
  query?: z.ZodType;
  body?: z.ZodType;
}

type Parsed<S, K extends keyof RequestSchemas> = S extends {
  [P in K]: infer T extends z.ZodType;
}
  ? z.output<T>
  : undefined;

export interface HandlerInput<S extends RequestSchemas, A extends boolean> {
  params: Parsed<S, 'params'>;
  query: Parsed<S, 'query'>;
  body: Parsed<S, 'body'>;
  cookies: Record<string, string>;
  auth: A extends true ? AuthContext : undefined;
}

interface BaseHandlerConfig<S extends RequestSchemas, A extends boolean> {
  schemas?: S;
  status?: number;
  message?: string;
  // Exige o AuthContext gravado pelo middleware de autenticação.
  auth?: A;
}

export interface HandlerConfig<
  S extends RequestSchemas,
  A extends boolean,
  TResult,
  TData,
> extends BaseHandlerConfig<S, A> {
  execute: (input: HandlerInput<S, A>) => Promise<TResult>;
  present: (result: TResult) => TData;
  cookies?: (result: TResult) => CookieInstruction[];
}

export interface PaginatedHandlerConfig<
  S extends RequestSchemas,
  A extends boolean,
  TItem,
  TData,
> extends BaseHandlerConfig<S, A> {
  execute: (input: HandlerInput<S, A>) => Promise<Page<TItem>>;
  present: (item: TItem) => TData;
}

const DEFAULT_MESSAGE = 'Requisição concluída com sucesso';

function readAuth(res: Response, required: boolean): AuthContext | undefined {
  const auth = res.locals['auth'] as AuthContext | undefined;

  if (required && !auth) {
    throw new UnauthorizedError('Autenticação necessária');
  }

  return required ? auth : undefined;
}

// ZodError lançado aqui é convertido em 400 pelo errorHandler global.
function parseRequest<S extends RequestSchemas, A extends boolean>(
  req: Request,
  res: Response,
  config: BaseHandlerConfig<S, A>,
): HandlerInput<S, A> {
  const auth = readAuth(res, config.auth === true);
  const schemas = config.schemas;

  return {
    params: schemas?.params?.parse(req.params),
    query: schemas?.query?.parse(req.query),
    body: schemas?.body?.parse(req.body),
    cookies: parseCookies(req.headers?.cookie),
    auth,
  } as HandlerInput<S, A>;
}

function applyCookies(res: Response, cookies: CookieInstruction[]): void {
  for (const cookie of cookies) {
    if ('clear' in cookie) {
      res.clearCookie(cookie.name, cookie.options);
    } else {
      res.cookie(cookie.name, cookie.value, cookie.options);
    }
  }
}

export function handler<
  S extends RequestSchemas,
  TResult,
  TData,
  A extends boolean = false,
>(config: HandlerConfig<S, A, TResult, TData>): RequestHandler {
  return async (req, res) => {
    const input = parseRequest(req, res, config);
    const result = await config.execute(input);

    if (config.cookies) {
      applyCookies(res, config.cookies(result));
    }

    const response: SuccessResponse<TData> = {
      ok: true,
      message: config.message ?? DEFAULT_MESSAGE,
      data: config.present(result),
    };

    res.status(config.status ?? 200).json(response);
  };
}

export function paginatedHandler<
  S extends RequestSchemas,
  TItem,
  TData,
  A extends boolean = false,
>(config: PaginatedHandlerConfig<S, A, TItem, TData>): RequestHandler {
  return async (req, res) => {
    const input = parseRequest(req, res, config);
    const page = await config.execute(input);

    const response: PaginatedResponse<TData> = {
      ok: true,
      message: config.message ?? DEFAULT_MESSAGE,
      data: page.items.map(config.present),
      pagination: toPaginationMeta(page),
    };

    res.status(config.status ?? 200).json(response);
  };
}

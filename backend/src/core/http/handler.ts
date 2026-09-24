import type { Request, RequestHandler } from 'express';
import type * as z from 'zod';
import type { Page } from '../types/pagination';
import type { PaginatedResponse, SuccessResponse } from '../types/response';
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

export interface HandlerInput<S extends RequestSchemas> {
  params: Parsed<S, 'params'>;
  query: Parsed<S, 'query'>;
  body: Parsed<S, 'body'>;
}

interface BaseHandlerConfig<S extends RequestSchemas> {
  schemas?: S;
  status?: number;
  message?: string;
}

export interface HandlerConfig<
  S extends RequestSchemas,
  TResult,
  TData,
> extends BaseHandlerConfig<S> {
  execute: (input: HandlerInput<S>) => Promise<TResult>;
  present: (result: TResult) => TData;
}

export interface PaginatedHandlerConfig<
  S extends RequestSchemas,
  TItem,
  TData,
> extends BaseHandlerConfig<S> {
  execute: (input: HandlerInput<S>) => Promise<Page<TItem>>;
  present: (item: TItem) => TData;
}

const DEFAULT_MESSAGE = 'Requisição concluída com sucesso';

// ZodError lançado aqui é convertido em 400 pelo errorHandler global.
function parseRequest<S extends RequestSchemas>(
  req: Request,
  schemas: S | undefined,
): HandlerInput<S> {
  return {
    params: schemas?.params?.parse(req.params),
    query: schemas?.query?.parse(req.query),
    body: schemas?.body?.parse(req.body),
  } as HandlerInput<S>;
}

export function handler<S extends RequestSchemas, TResult, TData>(
  config: HandlerConfig<S, TResult, TData>,
): RequestHandler {
  return async (req, res) => {
    const input = parseRequest(req, config.schemas);
    const result = await config.execute(input);

    const response: SuccessResponse<TData> = {
      ok: true,
      message: config.message ?? DEFAULT_MESSAGE,
      data: config.present(result),
    };

    res.status(config.status ?? 200).json(response);
  };
}

export function paginatedHandler<S extends RequestSchemas, TItem, TData>(
  config: PaginatedHandlerConfig<S, TItem, TData>,
): RequestHandler {
  return async (req, res) => {
    const input = parseRequest(req, config.schemas);
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

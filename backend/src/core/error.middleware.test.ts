import { afterEach, describe, expect, it, vi } from 'vitest';
import * as z from 'zod';
import './zod';
import { asResponse, fakeNext, fakeRequest, fakeResponse } from '../test/http';
import { BadRequestError, NotFoundError, UnauthorizedError } from './error';
import { errorHandler, notFoundHandler } from './error.middleware';

afterEach(() => {
  vi.restoreAllMocks();
});

function handle(error: unknown) {
  const res = fakeResponse();
  const next = fakeNext();
  errorHandler(error, fakeRequest(), asResponse(res), next);
  return { res, next };
}

describe('errorHandler', () => {
  it.each([
    [new BadRequestError('ruim'), 400],
    [new UnauthorizedError('sem acesso'), 401],
    [new NotFoundError('sumiu'), 404],
  ])('responde %s com o status do ApiError', (error, status) => {
    const { res } = handle(error);

    expect(res.statusCode).toBe(status);
    expect(res.body).toEqual({ ok: false, message: error.message });
  });

  it('converte ZodError em 400 com issues em português', () => {
    const result = z
      .object({ id: z.number(), user: z.object({ email: z.email() }) })
      .safeParse({ id: 'x', user: { email: 'nope' } });
    if (result.success) throw new Error('esperava falha de validação');

    const { res } = handle(result.error);

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      ok: false,
      message: 'Dados da requisição inválidos',
      issues: [
        { path: 'id', message: expect.any(String) },
        { path: 'user.email', message: expect.any(String) },
      ],
    });
    const issues = (res.body as { issues: { message: string }[] }).issues;
    expect(issues[0]?.message).not.toMatch(/Invalid input/);
  });

  it('converte JSON malformado do body-parser em 400', () => {
    const error = Object.assign(new SyntaxError('Unexpected token'), {
      status: 400,
      expose: true,
      type: 'entity.parse.failed',
    });

    const { res } = handle(error);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      ok: false,
      message: 'JSON malformado no corpo da requisição',
    });
  });

  it('repassa outros erros 4xx expostos pelo body-parser', () => {
    const error = Object.assign(new Error('request entity too large'), {
      status: 413,
      expose: true,
      type: 'entity.too.large',
    });

    const { res } = handle(error);

    expect(res.statusCode).toBe(413);
    expect(res.body).toEqual({
      ok: false,
      message: 'request entity too large',
    });
  });

  it('responde 500 genérico sem vazar mensagem ou causa e registra no log', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('senha do banco: segredo', {
      cause: 'detalhe interno',
    });

    const { res } = handle(error);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      ok: false,
      message: 'Erro interno no servidor',
    });
    expect(log).toHaveBeenCalledOnce();
    expect(String(log.mock.calls[0]?.[0])).toContain('senha do banco: segredo');
  });

  it('delega ao Express quando a resposta já foi enviada', () => {
    const res = fakeResponse();
    res.headersSent = true;
    const next = fakeNext();
    const error = new Error('tarde demais');

    errorHandler(error, fakeRequest(), asResponse(res), next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.body).toBeUndefined();
  });
});

describe('notFoundHandler', () => {
  it('encaminha NotFoundError com método e caminho', () => {
    const next = fakeNext();

    notFoundHandler(
      fakeRequest({ method: 'POST', path: '/nada' }),
      asResponse(fakeResponse()),
      next,
    );

    const error = next.mock.calls[0]?.[0];
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.message).toBe('Rota POST /nada não encontrada');
  });
});

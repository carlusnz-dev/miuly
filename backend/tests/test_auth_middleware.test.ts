import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../src/middleware/auth.middleware.js';

vi.mock('jsonwebtoken');

const makeRes = () =>
  ({ status: vi.fn().mockReturnThis(), json: vi.fn() }) as any;

describe('authMiddleware', () => {
  beforeEach(() => vi.resetAllMocks());

  it('responde 401 quando o token é inválido', () => {
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error('x');
    });

    const req = { cookies: { SESSIONID: 'ruim' } } as any;
    const res = makeRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('responde 401 quando não possui cookie', () => {
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error('x');
    });

    const req = { cookies: null } as any;
    const res = makeRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(jwt.verify).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('deixa passar e injeta userId quando token é válido', () => {
    vi.mocked(jwt.verify).mockReturnValue({ id: 1 } as any);

    const req = { cookies: { SESSIONID: 'certo' } } as any;
    const res = makeRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

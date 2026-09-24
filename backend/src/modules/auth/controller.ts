import { BaseController } from '../../core/base';
import type { CookieInstruction, CookieOptions } from '../../core/http/cookies';
import { handler } from '../../core/http/handler';
import {
  loginBodySchema,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  REFRESH_TOKEN_TTL_SECONDS,
  registerBodySchema,
  toAuthSessionResponse,
  toAuthUserResponse,
  type AuthSession,
} from './contract';
import type { AuthService } from './service';

export class AuthController extends BaseController<AuthService> {
  private readonly cookieOptions: CookieOptions;

  constructor(service: AuthService, secureCookies: boolean) {
    super(service);
    this.cookieOptions = {
      httpOnly: true,
      secure: secureCookies,
      sameSite: 'strict',
      path: REFRESH_COOKIE_PATH,
    };
  }

  register = handler({
    schemas: { body: registerBodySchema },
    status: 201,
    message: 'Conta criada',
    execute: ({ body }) => this.service.register(body),
    present: toAuthSessionResponse,
    cookies: (session) => this.setRefreshCookie(session),
  });

  login = handler({
    schemas: { body: loginBodySchema },
    message: 'Sessão iniciada',
    execute: ({ body }) => this.service.login(body),
    present: toAuthSessionResponse,
    cookies: (session) => this.setRefreshCookie(session),
  });

  refresh = handler({
    message: 'Sessão renovada',
    execute: ({ cookies }) =>
      this.service.refresh(cookies[REFRESH_COOKIE_NAME]),
    present: toAuthSessionResponse,
    cookies: (session) => this.setRefreshCookie(session),
  });

  logout = handler({
    message: 'Sessão encerrada',
    execute: ({ cookies }) => this.service.logout(cookies[REFRESH_COOKIE_NAME]),
    present: () => null,
    cookies: () => [
      { name: REFRESH_COOKIE_NAME, clear: true, options: this.cookieOptions },
    ],
  });

  me = handler({
    auth: true,
    message: 'Usuário autenticado',
    execute: ({ auth }) => this.service.me(auth),
    present: toAuthUserResponse,
  });

  private setRefreshCookie(session: AuthSession): CookieInstruction[] {
    return [
      {
        name: REFRESH_COOKIE_NAME,
        value: session.refreshToken,
        options: {
          ...this.cookieOptions,
          maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
        },
      },
    ];
  }
}

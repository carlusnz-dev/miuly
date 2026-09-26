import type { RequestHandler, Router } from 'express';
import { BaseRoutes } from '../../core/base';
import { TooManyRequestsError } from '../../core/error';
import type { RateLimiter } from '../../core/security/rate-limiter';
import { enforceRateLimit } from '../../core/security/rate-limiter';
import type { AuthController } from './controller';

export class AuthRoutes extends BaseRoutes<AuthController, Router> {
  constructor(
    controller: AuthController,
    private readonly requireAuth: RequestHandler,
    private readonly ipLimiter: RateLimiter,
  ) {
    super(controller);
  }

  register(router: Router): Router {
    router.post(
      '/register',
      this.limitByIp('register', 5, 60 * 60 * 1000),
      this.controller.register,
    );
    router.post(
      '/login',
      this.limitByIp('login', 20, 15 * 60 * 1000),
      this.controller.login,
    );
    router.post('/refresh', this.controller.refresh);
    router.post('/logout', this.controller.logout);
    router.get('/me', this.requireAuth, this.controller.me);

    return router;
  }

  private limitByIp(
    endpoint: 'register' | 'login',
    limit: number,
    windowMs: number,
  ): RequestHandler {
    return (req, res, next) => {
      let retryAfter: number | undefined;
      try {
        retryAfter = this.ipLimiter.consume(
          `auth-ip:${endpoint}:${req.ip}`,
          limit,
          windowMs,
        );
      } catch (error) {
        next(error);
        return;
      }
      if (retryAfter !== undefined) next(new TooManyRequestsError(retryAfter));
      else next();
    };
  }
}

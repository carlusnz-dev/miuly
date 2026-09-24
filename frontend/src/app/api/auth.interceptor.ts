import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { Session } from '../modules/auth/session';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith('/') || request.url.startsWith('//')) return next(request);
  if (request.url.startsWith('/auth/') && request.url !== '/auth/me') return next(request);

  const session = inject(Session);
  const router = inject(Router);
  const failAfterRetry = (error: unknown) => {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      session.clear();
      void router.navigateByUrl('/login');
    }
    return throwError(() => error);
  };
  const token = session.token();
  const authorized = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || !token) {
        return throwError(() => error);
      }
      const currentToken = session.token();
      if (currentToken && currentToken !== token) {
        return next(
          request.clone({ setHeaders: { Authorization: `Bearer ${currentToken}` } }),
        ).pipe(catchError(failAfterRetry));
      }
      return from(session.refresh()).pipe(
        switchMap((freshToken) =>
          freshToken
            ? next(request.clone({ setHeaders: { Authorization: `Bearer ${freshToken}` } }))
            : throwError(() => error),
        ),
        catchError(failAfterRetry),
      );
    }),
  );
};

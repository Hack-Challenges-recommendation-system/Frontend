import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/** Requests that a 401 must not retry: they are the token flow itself. */
function isTokenFlow(request: HttpRequest<unknown>): boolean {
  return (
    request.url.startsWith('/api/v1/auth/') || (request.method === 'POST' && request.url === '/api/v1/user')
  );
}

/**
 * Adds the access token to API calls. The token lives 5 minutes, so on a 401 the interceptor
 * refreshes it once and repeats the request; if the refresh fails, the user goes to the login page.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith('/api/')) {
    return next(request);
  }

  const auth = inject(AuthService);
  const router = inject(Router);
  const withToken = (original: HttpRequest<unknown>) => {
    const token = auth.token();
    return token ? original.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : original;
  };

  return next(withToken(request)).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || isTokenFlow(request)) {
        return throwError(() => error);
      }

      return auth.refresh().pipe(
        catchError((refreshError: unknown) => {
          void router.navigate(['/login']);
          return throwError(() => refreshError);
        }),
        switchMap(() => next(withToken(request))),
      );
    }),
  );
};

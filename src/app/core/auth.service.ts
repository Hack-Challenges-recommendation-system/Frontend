import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, Observable, of, shareReplay, switchMap, tap, throwError } from 'rxjs';

/**
 * Two-token auth of auth-service. The refresh token is an HttpOnly cookie the browser keeps;
 * the access token lives only in memory and is renewed with POST /auth/refresh.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly accessToken = signal<string | null>(null);
  private refreshInFlight: Observable<string> | null = null;

  readonly token = this.accessToken.asReadonly();
  readonly isSignedIn = computed(() => this.accessToken() !== null);

  register(nickname: string, email: string, password: string): Observable<void> {
    return this.http.post<void>('/api/v1/user', { nickname, email, password });
  }

  /** Sets the refresh cookie, then gets the first access token. */
  login(email: string, password: string): Observable<string> {
    return this.http.post<void>('/api/v1/auth/login', { email, password }).pipe(switchMap(() => this.refresh()));
  }

  /** Gets a new access token for the refresh cookie. Callers at the same time share one request. */
  refresh(): Observable<string> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.http.post('/api/v1/auth/refresh', null, { responseType: 'text' }).pipe(
        tap((token) => this.accessToken.set(token)),
        catchError((error: unknown) => {
          this.accessToken.set(null);
          return throwError(() => error);
        }),
        finalize(() => (this.refreshInFlight = null)),
        shareReplay(1),
      );
    }

    return this.refreshInFlight;
  }

  /** Runs at startup: a missing or expired cookie simply means the user is signed out. */
  restoreSession(): Observable<unknown> {
    return this.refresh().pipe(catchError(() => of(null)));
  }

  /** Ends this device's session; the access token is denylisted by the backend. */
  logout(): Observable<void> {
    return this.http.delete<void>('/api/v1/auth/logout').pipe(
      catchError(() => of(undefined)),
      finalize(() => this.accessToken.set(null)),
    );
  }

  clear(): void {
    this.accessToken.set(null);
  }
}

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, retry, tap, throwError, timer } from 'rxjs';
import { Profile, ProfileUpdate } from './api.models';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly current = signal<Profile | null>(null);

  readonly profile = this.current.asReadonly();

  /**
   * Right after registration the profile may not exist yet: auth-service creates it through Kafka.
   * A 404 is therefore retried a few times with a growing pause.
   */
  load(): Observable<Profile> {
    return this.http.get<Profile>('/api/v1/profile/me').pipe(
      retry({
        count: 5,
        delay: (error: unknown, attempt) =>
          error instanceof HttpErrorResponse && error.status === 404 ? timer(400 * attempt) : throwError(() => error),
      }),
      tap((profile) => this.current.set(profile)),
    );
  }

  save(update: ProfileUpdate): Observable<Profile> {
    return this.http.put<Profile>('/api/v1/profile/me', update).pipe(tap((profile) => this.current.set(profile)));
  }

  clear(): void {
    this.current.set(null);
  }
}

import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { Reaction, UserEvent } from './api.models';
import { AuthService } from './auth.service';

/** metric-service accepts at most 100 events per request. */
const BATCH_LIMIT = 100;

/**
 * Sends what the user does to metric-service: the data for history-based ranking and the A/B report.
 * Best effort: a lost event must never break the screen.
 */
@Injectable({ providedIn: 'root' })
export class EventsService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly ratings = signal<Readonly<Record<string, Reaction>>>({});

  /** The user's latest like or dislike of each material in this session. */
  readonly reactions = this.ratings.asReadonly();

  track(events: UserEvent[]): void {
    this.send(events).subscribe();
  }

  /**
   * Sends the events and completes once metric-service has stored them, so the next list of recommendations already
   * knows them. A failed request completes too.
   */
  send(events: UserEvent[]): Observable<void> {
    if (events.length === 0 || !this.auth.isSignedIn()) {
      return of(undefined);
    }

    const occurredAt = new Date().toISOString();
    const requests: Observable<unknown>[] = [];
    for (let start = 0; start < events.length; start += BATCH_LIMIT) {
      const batch = events.slice(start, start + BATCH_LIMIT).map((event) => ({ ...event, occurredAt }));
      requests.push(this.http.post('/api/v1/events', { events: batch }).pipe(catchError(() => of(null))));
    }

    return forkJoin(requests).pipe(map(() => undefined));
  }

  /** Records a like or dislike; the latest one counts. */
  react(event: UserEvent & { type: Reaction }): Observable<void> {
    this.ratings.update((ratings) => ({ ...ratings, [event.materialId]: event.type }));
    return this.send([event]);
  }

  /** Forgets the ratings of the session, e.g. on logout. */
  clear(): void {
    this.ratings.set({});
  }
}

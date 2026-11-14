import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { UserEvent } from './api.models';
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

  track(events: UserEvent[]): void {
    if (events.length === 0 || !this.auth.isSignedIn()) {
      return;
    }

    const occurredAt = new Date().toISOString();
    for (let start = 0; start < events.length; start += BATCH_LIMIT) {
      const batch = events.slice(start, start + BATCH_LIMIT).map((event) => ({ ...event, occurredAt }));
      this.http.post('/api/v1/events', { events: batch }).subscribe({ error: () => undefined });
    }
  }
}

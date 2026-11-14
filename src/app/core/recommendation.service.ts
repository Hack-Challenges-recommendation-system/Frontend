import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, switchMap, throwError } from 'rxjs';
import { Material, RecommendationList } from './api.models';
import { CatalogService } from './catalog.service';
import { ProfileService } from './profile.service';

/** Statuses that mean "recommendation-service can't answer", not "the request was wrong". */
const UNAVAILABLE = new Set([0, 404, 500, 502, 503, 504]);

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private readonly http = inject(HttpClient);
  private readonly catalog = inject(CatalogService);
  private readonly profiles = inject(ProfileService);

  /**
   * AI recommendations from recommendation-service. When it can't answer, the list comes from
   * topic matching on the profile goal instead (`engine: baseline`), so the main scenario still works.
   */
  getRecommendations(): Observable<RecommendationList> {
    return this.http.get<RecommendationList>('/api/v1/recommendations/me').pipe(
      catchError((error: unknown) =>
        error instanceof HttpErrorResponse && UNAVAILABLE.has(error.status) ? this.baseline() : throwError(() => error),
      ),
    );
  }

  private baseline(): Observable<RecommendationList> {
    const profile = this.profiles.profile();
    const goal = profile?.goal?.trim() ?? '';
    const stage = profile?.businessStage ?? null;

    const materials: Observable<Material[]> = goal
      ? this.catalog.search(goal, stage, 10).pipe(
          switchMap((results) => (results.length > 0 || !stage ? of(results) : this.catalog.search(goal, null, 10))),
          map((results) => results.map((result) => result.material)),
        )
      : this.catalog.list(stage, 10).pipe(map((page) => page.items));

    return materials.pipe(
      map((found) => ({
        recommendationId: crypto.randomUUID(),
        variant: 'baseline',
        engine: 'baseline' as const,
        clarifyingQuestion: found.length === 0 ? 'Опишите задачу подробнее, чтобы подбор был точнее.' : null,
        items: found.map((material, position) => ({
          material,
          reason: goal ? 'Совпадает с темой вашей задачи' : 'Подходит вашему этапу бизнеса',
          nextStep: null,
          position,
        })),
      })),
    );
  }
}

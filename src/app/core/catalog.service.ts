import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Material, MaterialPage, MaterialSearchResult } from './api.models';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);

  /** Topic-match search with Russian word forms; also the baseline when AI recommendations are unavailable. */
  search(query: string, stage: string | null = null, limit = 20): Observable<MaterialSearchResult[]> {
    let params = new HttpParams().set('q', query).set('limit', limit);
    if (stage) {
      params = params.set('stage', stage);
    }

    return this.http.get<MaterialSearchResult[]>('/api/v1/materials/search', { params });
  }

  list(stage: string | null = null, size = 20): Observable<MaterialPage> {
    let params = new HttpParams().set('size', size);
    if (stage) {
      params = params.set('stage', stage);
    }

    return this.http.get<MaterialPage>('/api/v1/materials', { params });
  }

  get(id: string): Observable<Material> {
    return this.http.get<Material>(`/api/v1/materials/${encodeURIComponent(id)}`);
  }
}

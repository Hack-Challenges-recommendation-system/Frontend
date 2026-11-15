import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { materialFixture, profileFixture } from '../testing/fixtures';
import { Profile, RecommendationList } from './api.models';
import { ProfileService } from './profile.service';
import { RecommendationService } from './recommendation.service';

describe('RecommendationService', () => {
  let service: RecommendationService;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(RecommendationService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  function withProfile(profile: Profile): void {
    TestBed.inject(ProfileService).load().subscribe();
    backend.expectOne('/api/v1/profile/me').flush(profile);
  }

  it('returns the list of recommendation-service', () => {
    const fromService: RecommendationList = {
      recommendationId: 'a1f5b0f2-9d7e-4a43-8f8a-1c2d3e4f5a6b',
      variant: 'A',
      engine: 'llm',
      clarifyingQuestion: null,
      items: [{ material: materialFixture, reason: 'Ваш этап — запуск', nextStep: 'Составьте список', position: 0 }],
    };
    let received: RecommendationList | undefined;

    service.getRecommendations().subscribe((list) => (received = list));
    backend.expectOne('/api/v1/recommendations/me').flush(fromService);

    expect(received).toEqual(fromService);
  });

  it('falls back to topic matching on the profile goal when the service is unavailable', () => {
    withProfile(profileFixture);
    let received: RecommendationList | undefined;

    service.getRecommendations().subscribe((list) => (received = list));
    backend.expectOne('/api/v1/recommendations/me').flush(null, { status: 503, statusText: 'Service Unavailable' });

    const search = backend.expectOne((request) => request.url === '/api/v1/materials/search');
    expect(search.request.params.get('q')).toBe('найти первых клиентов');
    expect(search.request.params.get('stage')).toBe('LAUNCH');
    search.flush([{ material: materialFixture, score: 0.4 }]);

    expect(received?.engine).toBe('baseline');
    expect(received?.items.map((item) => item.material.id)).toEqual(['m-1']);
    expect(received?.items[0].reason).toBe('Совпадает с темой вашей задачи');
    expect(received?.clarifyingQuestion).toBeNull();
  });

  it('asks to clarify the task when nothing matches', () => {
    withProfile(profileFixture);
    let received: RecommendationList | undefined;

    service.getRecommendations().subscribe((list) => (received = list));
    backend.expectOne('/api/v1/recommendations/me').flush(null, { status: 404, statusText: 'Not Found' });
    backend.expectOne((request) => request.params.get('stage') === 'LAUNCH').flush([]);
    backend.expectOne((request) => request.url === '/api/v1/materials/search' && !request.params.has('stage')).flush([]);

    expect(received?.items).toEqual([]);
    expect(received?.clarifyingQuestion).toContain('Опишите задачу');
  });

  it('uses the stage when the profile has no goal', () => {
    withProfile({ ...profileFixture, goal: null });
    let received: RecommendationList | undefined;

    service.getRecommendations().subscribe((list) => (received = list));
    backend.expectOne('/api/v1/recommendations/me').flush(null, { status: 502, statusText: 'Bad Gateway' });
    const list = backend.expectOne((request) => request.url === '/api/v1/materials');
    expect(list.request.params.get('stage')).toBe('LAUNCH');
    list.flush({ items: [materialFixture], page: 0, size: 10, totalElements: 1, totalPages: 1 });

    expect(received?.items[0].reason).toBe('Подходит вашему этапу бизнеса');
  });

  it('passes other errors through', () => {
    let failed = false;

    service.getRecommendations().subscribe({ error: () => (failed = true) });
    backend.expectOne('/api/v1/recommendations/me').flush(null, { status: 400, statusText: 'Bad Request' });

    expect(failed).toBe(true);
  });
});

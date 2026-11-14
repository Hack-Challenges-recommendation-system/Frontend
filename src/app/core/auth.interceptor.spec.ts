import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => backend.verify());

  function signIn(token = 'old-token'): void {
    TestBed.inject(AuthService).refresh().subscribe();
    backend.expectOne('/api/v1/auth/refresh').flush(token);
  }

  it('adds the access token to API calls', () => {
    signIn();

    http.get('/api/v1/profiles/me').subscribe();

    const request = backend.expectOne('/api/v1/profiles/me');
    expect(request.request.headers.get('Authorization')).toBe('Bearer old-token');
    request.flush({});
  });

  it('refreshes an expired token once and repeats the request', () => {
    signIn();
    let body: unknown;

    http.get('/api/v1/profiles/me').subscribe((value) => (body = value));
    backend.expectOne('/api/v1/profiles/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/api/v1/auth/refresh').flush('new-token');

    const retried = backend.expectOne('/api/v1/profiles/me');
    expect(retried.request.headers.get('Authorization')).toBe('Bearer new-token');
    retried.flush({ nickname: 'founder' });
    expect(body).toEqual({ nickname: 'founder' });
  });

  it('sends the user to the login page when the refresh fails', () => {
    signIn();
    let failed = false;

    http.get('/api/v1/profiles/me').subscribe({ error: () => (failed = true) });
    backend.expectOne('/api/v1/profiles/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/api/v1/auth/refresh').flush(null, { status: 404, statusText: 'Not Found' });

    expect(failed).toBe(true);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('does not retry the token flow itself', () => {
    let failed = false;

    http.post('/api/v1/auth/login', {}).subscribe({ error: () => (failed = true) });
    backend.expectOne('/api/v1/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });

    backend.expectNone('/api/v1/auth/refresh');
    expect(failed).toBe(true);
  });

  it('leaves requests outside the API alone', () => {
    signIn();

    http.get('/assets/config.json').subscribe();

    expect(backend.expectOne('/assets/config.json').request.headers.has('Authorization')).toBe(false);
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let auth: AuthService;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    auth = TestBed.inject(AuthService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('logs in, then exchanges the refresh cookie for an access token', () => {
    let token: string | undefined;
    auth.login('founder@example.com', 'password123').subscribe((value) => (token = value));

    const login = backend.expectOne('/api/v1/auth/login');
    expect(login.request.method).toBe('POST');
    expect(login.request.body).toEqual({ email: 'founder@example.com', password: 'password123' });
    login.flush(null, { status: 204, statusText: 'No Content' });
    backend.expectOne('/api/v1/auth/refresh').flush('access-token');

    expect(token).toBe('access-token');
    expect(auth.isSignedIn()).toBe(true);
  });

  it('treats a missing refresh cookie at startup as signed out', () => {
    let completed = false;
    auth.restoreSession().subscribe({ complete: () => (completed = true) });

    backend.expectOne('/api/v1/auth/refresh').flush(null, { status: 400, statusText: 'Bad Request' });

    expect(completed).toBe(true);
    expect(auth.isSignedIn()).toBe(false);
  });

  it('shares one refresh request between callers', () => {
    const tokens: string[] = [];
    auth.refresh().subscribe((token) => tokens.push(token));
    auth.refresh().subscribe((token) => tokens.push(token));

    backend.expectOne('/api/v1/auth/refresh').flush('access-token');

    expect(tokens).toEqual(['access-token', 'access-token']);
  });

  it('forgets the token on logout even when the request fails', () => {
    auth.refresh().subscribe();
    backend.expectOne('/api/v1/auth/refresh').flush('access-token');

    auth.logout().subscribe();
    backend.expectOne('/api/v1/auth/logout').flush(null, { status: 500, statusText: 'Server Error' });

    expect(auth.isSignedIn()).toBe(false);
  });
});

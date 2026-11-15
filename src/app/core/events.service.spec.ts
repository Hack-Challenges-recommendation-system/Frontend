import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { EventsService } from './events.service';

describe('EventsService', () => {
  let signedIn: boolean;
  let service: EventsService;
  let backend: HttpTestingController;

  beforeEach(() => {
    signedIn = true;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { isSignedIn: () => signedIn } },
      ],
    });
    service = TestBed.inject(EventsService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('completes a rating only after metric-service has stored it', () => {
    let done = false;

    service.react({ type: 'DISLIKE', materialId: 'm-1', surface: 'home' }).subscribe(() => (done = true));
    expect(service.reactions()).toEqual({ 'm-1': 'DISLIKE' });
    expect(done).toBe(false);

    const request = backend.expectOne('/api/v1/events');
    expect(request.request.body.events[0]).toMatchObject({ type: 'DISLIKE', materialId: 'm-1' });
    request.flush(null, { status: 202, statusText: 'Accepted' });

    expect(done).toBe(true);
  });

  it('keeps the latest rating and completes even when the request fails', () => {
    let done = false;
    service.react({ type: 'LIKE', materialId: 'm-1' }).subscribe();
    backend.expectOne('/api/v1/events').flush(null, { status: 202, statusText: 'Accepted' });

    service.react({ type: 'DISLIKE', materialId: 'm-1' }).subscribe(() => (done = true));
    backend.expectOne('/api/v1/events').flush(null, { status: 503, statusText: 'Service Unavailable' });

    expect(service.reactions()['m-1']).toBe('DISLIKE');
    expect(done).toBe(true);
  });

  it('sends nothing while signed out', () => {
    signedIn = false;
    let done = false;

    service.send([{ type: 'IMPRESSION', materialId: 'm-1' }]).subscribe(() => (done = true));

    expect(done).toBe(true);
    backend.expectNone('/api/v1/events');
  });
});

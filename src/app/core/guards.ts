import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';
import { ProfileService } from './profile.service';

export const signedInGuard: CanActivateFn = () =>
  inject(AuthService).isSignedIn() ? true : inject(Router).createUrlTree(['/login']);

export const signedOutGuard: CanActivateFn = () =>
  inject(AuthService).isSignedIn() ? inject(Router).createUrlTree(['/']) : true;

/** Sends new users to onboarding before the first recommendations. */
export const onboardingGuard: CanActivateFn = () => {
  const profiles = inject(ProfileService);
  const router = inject(Router);
  const cached = profiles.profile();

  if (cached) {
    return cached.onboardingCompleted ? true : router.createUrlTree(['/onboarding']);
  }

  return profiles.load().pipe(
    map((profile) => (profile.onboardingCompleted ? true : router.createUrlTree(['/onboarding']))),
    catchError(() => of(router.createUrlTree(['/onboarding']))),
  );
};

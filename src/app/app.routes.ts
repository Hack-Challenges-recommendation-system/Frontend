import { Routes } from '@angular/router';
import { onboardingGuard, signedInGuard, signedOutGuard } from './core/guards';
import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [signedOutGuard],
    title: 'Вход · Знания в нужный момент',
    loadComponent: () => import('./pages/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [signedOutGuard],
    title: 'Регистрация · Знания в нужный момент',
    loadComponent: () => import('./pages/register-page').then((m) => m.RegisterPage),
  },
  {
    path: '',
    component: Shell,
    canActivate: [signedInGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [onboardingGuard],
        title: 'Подборка · Знания в нужный момент',
        loadComponent: () => import('./pages/home-page').then((m) => m.HomePage),
      },
      {
        path: 'onboarding',
        title: 'Знакомство · Знания в нужный момент',
        loadComponent: () => import('./pages/onboarding-page').then((m) => m.OnboardingPage),
      },
      {
        path: 'search',
        title: 'Поиск · Знания в нужный момент',
        loadComponent: () => import('./pages/search-page').then((m) => m.SearchPage),
      },
      {
        path: 'materials/:id',
        title: 'Материал · Знания в нужный момент',
        loadComponent: () => import('./pages/material-page').then((m) => m.MaterialPage),
      },
      {
        path: 'profile',
        title: 'Профиль · Знания в нужный момент',
        loadComponent: () => import('./pages/profile-page').then((m) => m.ProfilePage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];

import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileUpdate } from '../core/api.models';
import { ProfileService } from '../core/profile.service';
import { ProfileForm } from '../shared/profile-form';

@Component({
  selector: 'app-onboarding-page',
  imports: [ProfileForm],
  template: `
    <section class="hero hero-compact">
      <div class="container">
        <h1>Расскажите <span class="accent">о бизнесе</span></h1>
        <p>Несколько вопросов, чтобы подборка подошла именно вам. Любой можно пропустить.</p>
      </div>
    </section>
    <div class="container page">
      <div class="card fade-in">
        @if (profiles.profile(); as profile) {
          <app-profile-form [profile]="profile" submitLabel="Подобрать материалы" (submitted)="save($event)" />
        } @else if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        } @else {
          <p class="muted">Загружаем профиль…</p>
        }
      </div>
    </div>
  `,
})
export class OnboardingPage {
  protected readonly profiles = inject(ProfileService);
  private readonly router = inject(Router);
  protected readonly error = signal<string | null>(null);

  constructor() {
    if (!this.profiles.profile()) {
      this.profiles.load().subscribe({ error: () => this.error.set('Не получилось загрузить профиль. Обновите страницу') });
    }
  }

  protected save(update: ProfileUpdate): void {
    this.profiles.save(update).subscribe({
      next: () => void this.router.navigateByUrl('/'),
      error: () => this.error.set('Не получилось сохранить ответы. Попробуйте ещё раз'),
    });
  }
}

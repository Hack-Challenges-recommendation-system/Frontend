import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Profile, ProfileUpdate } from '../core/api.models';
import { ProfileService } from '../core/profile.service';
import { ProfileForm } from '../shared/profile-form';

/**
 * Short and optional onboarding: every question, and the whole form, can be skipped. A skipped onboarding gives a
 * starter selection that the answers make more precise later.
 */
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
    <div class="container page stack">
      <div class="card fade-in">
        @if (profiles.profile(); as profile) {
          <app-profile-form [profile]="profile" submitLabel="Подобрать материалы" (submitted)="save($event)" />
        } @else if (!error()) {
          <p class="muted">Загружаем профиль…</p>
        }
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
      </div>
      @if (profiles.profile(); as profile) {
        <div class="skip">
          <button class="btn btn-ghost btn-block" type="button" [disabled]="saving()" (click)="skip(profile)">
            Пропустить
          </button>
          <p class="muted">Покажем стартовую подборку, а ответить можно позже в профиле.</p>
        </div>
      }
    </div>
  `,
})
export class OnboardingPage {
  protected readonly profiles = inject(ProfileService);
  private readonly router = inject(Router);
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);

  constructor() {
    if (!this.profiles.profile()) {
      this.profiles.load().subscribe({ error: () => this.error.set('Не получилось загрузить профиль. Обновите страницу') });
    }
  }

  protected save(update: ProfileUpdate): void {
    this.saving.set(true);
    this.error.set(null);
    this.profiles.save(update).subscribe({
      next: () => void this.router.navigateByUrl('/'),
      error: () => {
        this.saving.set(false);
        this.error.set('Не получилось сохранить ответы. Попробуйте ещё раз');
      },
    });
  }

  /** Keeps the answers as they are; saving them marks onboarding as completed. */
  protected skip(profile: Profile): void {
    this.save({
      nickname: profile.nickname,
      businessStage: profile.businessStage,
      businessSphere: profile.businessSphere,
      experience: profile.experience,
      goal: profile.goal,
      preferredFormats: profile.preferredFormats,
    });
  }
}

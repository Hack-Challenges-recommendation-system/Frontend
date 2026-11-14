import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileUpdate } from '../core/api.models';
import { AuthService } from '../core/auth.service';
import { ProfileService } from '../core/profile.service';
import { ProfileForm } from '../shared/profile-form';

@Component({
  selector: 'app-profile-page',
  imports: [ProfileForm],
  template: `
    <section class="hero hero-compact">
      <div class="container">
        <h1>Ваш <span class="accent">профиль</span></h1>
        <p>Ответы помогают подбирать материалы точнее.</p>
      </div>
    </section>
    <div class="container page stack">
      <div class="card fade-in">
        @if (profiles.profile(); as profile) {
          <app-profile-form [profile]="profile" submitLabel="Сохранить" (submitted)="save($event)" />
        } @else {
          <p class="muted">Загружаем профиль…</p>
        }
        @if (status()) {
          <p class="status" role="status">{{ status() }}</p>
        }
      </div>
      <button class="btn btn-ghost" type="button" (click)="logout()">Выйти</button>
    </div>
  `,
})
export class ProfilePage {
  protected readonly profiles = inject(ProfileService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly status = signal<string | null>(null);

  constructor() {
    if (!this.profiles.profile()) {
      this.profiles.load().subscribe({ error: () => this.status.set('Не получилось загрузить профиль') });
    }
  }

  protected save(update: ProfileUpdate): void {
    this.status.set(null);
    this.profiles.save(update).subscribe({
      next: () => this.status.set('Сохранено. Подборка обновится на главной'),
      error: () => this.status.set('Не получилось сохранить. Попробуйте ещё раз'),
    });
  }

  protected logout(): void {
    this.auth.logout().subscribe(() => {
      this.profiles.clear();
      void this.router.navigateByUrl('/login');
    });
  }
}

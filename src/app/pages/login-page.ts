import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth">
      <div class="auth-hero">
        <h1>Знания <span class="accent">в нужный момент</span></h1>
        <p>Подберём материалы под задачу вашего бизнеса.</p>
      </div>
      <form class="card auth-card fade-in" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <h2>Вход</h2>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" class="input" type="email" formControlName="email" autocomplete="email" />
        </div>
        <div class="field">
          <label for="password">Пароль</label>
          <input id="password" class="input" type="password" formControlName="password" autocomplete="current-password" />
        </div>
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        <button class="btn btn-primary btn-block" type="submit" [disabled]="pending()">Войти</button>
        <p class="muted">Нет аккаунта? <a routerLink="/register">Зарегистрироваться</a></p>
      </form>
    </section>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Введите email и пароль');
      return;
    }

    this.pending.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();

    this.auth.login(email, password).subscribe({
      next: () => void this.router.navigateByUrl('/'),
      error: (error: unknown) => {
        this.pending.set(false);
        this.error.set(
          error instanceof HttpErrorResponse && error.status === 401
            ? 'Неверный email или пароль'
            : 'Не получилось войти. Попробуйте ещё раз',
        );
      },
    });
  }
}

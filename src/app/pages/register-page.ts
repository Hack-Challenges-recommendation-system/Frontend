import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth">
      <div class="auth-hero">
        <h1>Знания <span class="accent">в нужный момент</span></h1>
        <p>Расскажете о бизнесе, а мы подберём статьи, видео и курсы под вашу задачу.</p>
      </div>
      <form class="card auth-card fade-in" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <h2>Регистрация</h2>
        <div class="field">
          <label for="nickname">Как к вам обращаться</label>
          <input id="nickname" class="input" formControlName="nickname" maxlength="30" autocomplete="nickname" />
          @if (form.controls.nickname.touched && form.controls.nickname.invalid) {
            <span class="error">От 3 до 30 символов</span>
          }
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" class="input" type="email" formControlName="email" autocomplete="email" />
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <span class="error">Проверьте email</span>
          }
        </div>
        <div class="field">
          <label for="password">Пароль</label>
          <input id="password" class="input" type="password" formControlName="password" autocomplete="new-password" />
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <span class="error">Не меньше 8 символов</span>
          }
        </div>
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        <button class="btn btn-primary btn-block" type="submit" [disabled]="pending()">Создать аккаунт</button>
        <p class="muted">Уже есть аккаунт? <a routerLink="/login">Войти</a></p>
      </form>
    </section>
  `,
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = inject(NonNullableFormBuilder).group({
    nickname: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.pending.set(true);
    this.error.set(null);
    const { nickname, email, password } = this.form.getRawValue();

    this.auth
      .register(nickname.trim(), email, password)
      .pipe(switchMap(() => this.auth.login(email, password)))
      .subscribe({
        next: () => void this.router.navigateByUrl('/onboarding'),
        error: (error: unknown) => {
          this.pending.set(false);
          this.error.set(
            error instanceof HttpErrorResponse && error.status === 409
              ? 'Этот email уже зарегистрирован'
              : 'Не получилось зарегистрироваться. Проверьте поля и попробуйте ещё раз',
          );
        },
      });
  }
}

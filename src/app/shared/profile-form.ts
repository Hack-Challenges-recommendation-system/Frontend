import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BusinessStage, Experience, Profile, ProfileUpdate } from '../core/api.models';
import { EXPERIENCE, FORMATS, SPHERES, STAGES } from '../core/labels';

/** Onboarding answers. Only the nickname is required, so a user can skip any question. */
@Component({
  selector: 'app-profile-form',
  imports: [ReactiveFormsModule],
  template: `
    <form class="stack" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="field">
        <label for="nickname">Как к вам обращаться</label>
        <input id="nickname" class="input" formControlName="nickname" maxlength="30" autocomplete="nickname" />
        @if (form.controls.nickname.touched && form.controls.nickname.invalid) {
          <span class="error">От 3 до 30 символов</span>
        }
      </div>

      <fieldset class="field">
        <legend>Этап бизнеса</legend>
        <div class="options">
          @for (stage of stages; track stage.value) {
            <label class="option" [class.selected]="form.controls.businessStage.value === stage.value">
              <input type="radio" formControlName="businessStage" [value]="stage.value" />
              <strong>{{ stage.label }}</strong>
              <span class="muted">{{ stage.hint }}</span>
            </label>
          }
        </div>
      </fieldset>

      <fieldset class="field">
        <legend>Опыт в предпринимательстве</legend>
        <div class="chips">
          @for (item of experience; track item.value) {
            <label class="chip" [class.selected]="form.controls.experience.value === item.value">
              <input type="radio" formControlName="experience" [value]="item.value" />
              {{ item.label }}
            </label>
          }
        </div>
      </fieldset>

      <div class="field">
        <label for="sphere">Сфера бизнеса</label>
        <input
          id="sphere"
          class="input"
          formControlName="businessSphere"
          list="spheres"
          maxlength="64"
          placeholder="Например, общепит"
        />
        <datalist id="spheres">
          @for (sphere of spheres; track sphere) {
            <option [value]="sphere"></option>
          }
        </datalist>
      </div>

      <div class="field">
        <label for="goal">Какую задачу вы решаете сейчас?</label>
        <textarea
          id="goal"
          class="input"
          rows="3"
          formControlName="goal"
          maxlength="500"
          placeholder="Например: найти первых клиентов для кофейни"
        ></textarea>
      </div>

      <fieldset class="field">
        <legend>Удобные форматы</legend>
        <div class="chips">
          @for (format of formats; track format.value) {
            <button
              type="button"
              class="chip"
              [attr.aria-pressed]="selectedFormats().includes(format.value)"
              (click)="toggleFormat(format.value)"
            >
              {{ format.label }}
            </button>
          }
        </div>
      </fieldset>

      <button class="btn btn-primary" type="submit">{{ submitLabel() }}</button>
    </form>
  `,
})
export class ProfileForm {
  readonly profile = input<Profile | null>(null);
  readonly submitLabel = input('Сохранить');
  readonly submitted = output<ProfileUpdate>();

  protected readonly stages = STAGES;
  protected readonly experience = EXPERIENCE;
  protected readonly formats = FORMATS;
  protected readonly spheres = SPHERES;
  protected readonly selectedFormats = signal<string[]>([]);

  private readonly fb = inject(FormBuilder);
  protected readonly form = this.fb.group({
    nickname: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]),
    businessStage: this.fb.control<BusinessStage | null>(null),
    experience: this.fb.control<Experience | null>(null),
    businessSphere: this.fb.nonNullable.control('', Validators.maxLength(64)),
    goal: this.fb.nonNullable.control('', Validators.maxLength(500)),
  });

  constructor() {
    effect(() => {
      const profile = this.profile();
      if (!profile) {
        return;
      }

      this.form.patchValue({
        nickname: profile.nickname,
        businessStage: profile.businessStage,
        experience: profile.experience,
        businessSphere: profile.businessSphere ?? '',
        goal: profile.goal ?? '',
      });
      this.selectedFormats.set([...profile.preferredFormats]);
    });
  }

  protected toggleFormat(format: string): void {
    this.selectedFormats.update((selected) =>
      selected.includes(format) ? selected.filter((value) => value !== format) : [...selected, format],
    );
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.submitted.emit({
      nickname: value.nickname.trim(),
      businessStage: value.businessStage,
      experience: value.experience,
      businessSphere: value.businessSphere.trim() || null,
      goal: value.goal.trim() || null,
      preferredFormats: this.selectedFormats(),
    });
  }
}

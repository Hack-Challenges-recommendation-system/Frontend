import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Material, Reaction } from '../core/api.models';
import { accessLabel, durationLabel, formatLabel, levelLabel } from '../core/labels';

/**
 * One material in a list. A paid material shows only its short benefit; details are behind its link.
 * In a list of recommendations it also shows its place in the order and lets the user rate it.
 */
@Component({
  selector: 'app-material-card',
  imports: [RouterLink],
  template: `
    <article class="card material-card fade-in" [class.material-card-fresh]="fresh()">
      <div class="meta">
        @if (step()) {
          <span class="step" [attr.aria-label]="'Шаг ' + step()">{{ step() }}</span>
        }
        @if (fresh()) {
          <span class="badge badge-new">Новое</span>
        }
        @if (material().format) {
          <span class="badge">{{ format(material().format) }}</span>
        }
        @if (material().durationMinutes) {
          <span class="muted">{{ duration(material().durationMinutes) }}</span>
        }
        @if (material().level) {
          <span class="muted">· {{ level(material().level) }}</span>
        }
        @if (access(); as label) {
          <span class="badge badge-paid">{{ label }}</span>
        }
      </div>
      <h3 class="material-title">
        <a [routerLink]="['/materials', material().id]" [queryParams]="context()" (click)="opened.emit()">
          {{ material().title }}
        </a>
      </h3>
      @if (material().summary) {
        <p class="summary">
          @if (access()) {
            <strong>Что даст: </strong>
          }
          {{ material().summary }}
        </p>
      }
      @if (reason()) {
        <p class="reason"><span class="reason-label">Почему вам</span>{{ reason() }}</p>
      }
      @if (nextStep()) {
        <p class="reason"><span class="reason-label">Следующий шаг</span>{{ nextStep() }}</p>
      }
      @if (rateable()) {
        <div class="reactions" role="group" aria-label="Оценка материала">
          <button
            class="chip chip-small"
            type="button"
            [attr.aria-pressed]="reaction() === 'LIKE'"
            [disabled]="busy()"
            (click)="reacted.emit('LIKE')"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 11v10H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h3Zm2 10V11l4-8a2.5 2.5 0 0 1 2.5 2.5V9h4.6a2 2 0 0 1 2 2.3l-1.2 7.9a2 2 0 0 1-2 1.8H9Z" />
            </svg>
            Полезно
          </button>
          <button
            class="chip chip-small"
            type="button"
            [attr.aria-pressed]="reaction() === 'DISLIKE'"
            [disabled]="busy()"
            (click)="reacted.emit('DISLIKE')"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17 13V3h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-3Zm-2-10v10l-4 8a2.5 2.5 0 0 1-2.5-2.5V15H3.9a2 2 0 0 1-2-2.3l1.2-7.9a2 2 0 0 1 2-1.8H15Z" />
            </svg>
            Не подходит
          </button>
        </div>
      }
    </article>
  `,
})
export class MaterialCard {
  readonly material = input.required<Material>();
  readonly reason = input<string | null>(null);
  readonly nextStep = input<string | null>(null);
  /** Query parameters that attribute later events on the material page to this list. */
  readonly context = input<Record<string, string | number> | null>(null);
  /** The place of the material in a list of recommendations, from 1. */
  readonly step = input<number | null>(null);
  /** The material came into the list after the user's last rating. */
  readonly fresh = input(false);
  /** Shows the buttons to like or dislike the material. */
  readonly rateable = input(false);
  readonly reaction = input<Reaction | null>(null);
  readonly busy = input(false);
  readonly opened = output<void>();
  readonly reacted = output<Reaction>();

  protected readonly access = computed(() => accessLabel(this.material()));
  protected readonly format = formatLabel;
  protected readonly duration = durationLabel;
  protected readonly level = levelLabel;
}

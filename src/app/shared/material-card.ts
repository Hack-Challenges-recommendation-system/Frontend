import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Material } from '../core/api.models';
import { durationLabel, formatLabel, levelLabel } from '../core/labels';

/** One material in a list. A paid material shows only its short benefit; details are behind its link. */
@Component({
  selector: 'app-material-card',
  imports: [RouterLink],
  template: `
    <article class="card material-card fade-in">
      <div class="meta">
        @if (material().format) {
          <span class="badge">{{ format(material().format) }}</span>
        }
        @if (material().durationMinutes) {
          <span class="muted">{{ duration(material().durationMinutes) }}</span>
        }
        @if (material().level) {
          <span class="muted">· {{ level(material().level) }}</span>
        }
        @if (material().paid) {
          <span class="badge badge-paid">Платный</span>
        }
      </div>
      <h3 class="material-title">
        <a [routerLink]="['/materials', material().id]" [queryParams]="context()" (click)="opened.emit()">
          {{ material().title }}
        </a>
      </h3>
      @if (material().summary) {
        <p class="summary">
          @if (material().paid) {
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
    </article>
  `,
})
export class MaterialCard {
  readonly material = input.required<Material>();
  readonly reason = input<string | null>(null);
  readonly nextStep = input<string | null>(null);
  /** Query parameters that attribute later events on the material page to this list. */
  readonly context = input<Record<string, string | number> | null>(null);
  readonly opened = output<void>();

  protected readonly format = formatLabel;
  protected readonly duration = durationLabel;
  protected readonly level = levelLabel;
}

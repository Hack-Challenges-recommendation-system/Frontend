import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventType, Material, Reaction, UserEvent } from '../core/api.models';
import { CatalogService } from '../core/catalog.service';
import { EventsService } from '../core/events.service';
import { accessLabel, durationLabel, formatLabel, levelLabel } from '../core/labels';

/**
 * One material. The query parameters (rid, variant, pos, surface) come from the list that led here,
 * so START, COMPLETE and ratings are attributed to that list in the A/B report.
 */
@Component({
  selector: 'app-material-page',
  imports: [RouterLink],
  template: `
    <div class="container page">
      <a class="back-link" routerLink="/">← К подборке</a>
      @if (material(); as m) {
        <article class="card stack fade-in">
          <div class="meta">
            @if (m.format) {
              <span class="badge">{{ format(m.format) }}</span>
            }
            @if (m.durationMinutes) {
              <span class="muted">{{ duration(m.durationMinutes) }}</span>
            }
            @if (m.level) {
              <span class="muted">· {{ level(m.level) }}</span>
            }
            @if (access(m); as label) {
              <span class="badge badge-paid">{{ label }}</span>
            }
          </div>
          <h1 class="material-heading">{{ m.title }}</h1>
          @if (m.paid) {
            <div class="notice">
              <strong>{{ m.access === 'SUBSCRIPTION' ? 'Материал по подписке.' : 'Платный материал.' }}</strong>
              @if (m.summary) {
                {{ m.summary }}
              }
              Подробности — по ссылке.
            </div>
          } @else if (m.summary) {
            <p>{{ m.summary }}</p>
          }
          @if (m.topics.length) {
            <div class="tags">
              @for (topic of m.topics; track topic) {
                <span class="badge">{{ topic }}</span>
              }
            </div>
          }
          <div class="actions">
            <a class="btn btn-primary" [href]="m.url" target="_blank" rel="noopener noreferrer" (click)="track('START')">
              {{ m.paid ? 'Перейти к материалу' : 'Открыть материал' }}
            </a>
            <button class="btn btn-ghost" type="button" [disabled]="completed()" (click)="complete()">
              {{ completed() ? 'Отмечено как изученное' : 'Я изучил' }}
            </button>
          </div>
          <div class="rating" role="group" aria-label="Оценка материала">
            <span class="muted">Полезно?</span>
            <button class="chip" type="button" [attr.aria-pressed]="rating() === 'LIKE'" (click)="rate('LIKE')">Да</button>
            <button class="chip" type="button" [attr.aria-pressed]="rating() === 'DISLIKE'" (click)="rate('DISLIKE')">
              Нет
            </button>
          </div>
          @if (rating()) {
            <p class="muted" role="status">Спасибо! Подборка на главной учтёт вашу оценку.</p>
          }
        </article>
      } @else if (notFound()) {
        <p class="notice">Материал не найден.</p>
      } @else {
        <div class="card skeleton" aria-hidden="true"></div>
      }
    </div>
  `,
})
export class MaterialPage implements OnInit {
  readonly id = input.required<string>();
  readonly rid = input<string>();
  readonly variant = input<string>();
  readonly pos = input<string>();
  readonly surface = input<string>();

  private readonly catalog = inject(CatalogService);
  private readonly events = inject(EventsService);

  protected readonly material = signal<Material | null>(null);
  protected readonly notFound = signal(false);
  protected readonly completed = signal(false);
  /** The latest rating of this material in the session, here or on a card of the list. */
  protected readonly rating = computed<Reaction | null>(() => this.events.reactions()[this.id()] ?? null);

  protected readonly format = formatLabel;
  protected readonly duration = durationLabel;
  protected readonly level = levelLabel;
  protected readonly access = accessLabel;

  ngOnInit(): void {
    this.catalog.get(this.id()).subscribe({
      next: (material) => this.material.set(material),
      error: () => this.notFound.set(true),
    });
  }

  protected complete(): void {
    this.completed.set(true);
    this.track('COMPLETE');
  }

  protected rate(rating: Reaction): void {
    if (this.rating() === rating) {
      return;
    }

    this.events.react({ ...this.event(rating), type: rating }).subscribe();
  }

  protected track(type: EventType): void {
    this.events.track([this.event(type)]);
  }

  private event(type: EventType): UserEvent {
    const position = this.pos();

    return {
      type,
      materialId: this.id(),
      recommendationId: this.rid() ?? null,
      variant: this.variant() ?? null,
      position: position === undefined || Number.isNaN(Number(position)) ? null : Number(position),
      surface: this.surface() ?? 'material',
    };
  }
}

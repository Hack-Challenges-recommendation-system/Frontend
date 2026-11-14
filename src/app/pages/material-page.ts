import { Component, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventType, Material } from '../core/api.models';
import { CatalogService } from '../core/catalog.service';
import { EventsService } from '../core/events.service';
import { durationLabel, formatLabel, levelLabel } from '../core/labels';

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
            @if (m.paid) {
              <span class="badge badge-paid">Платный</span>
            }
          </div>
          <h1 class="material-heading">{{ m.title }}</h1>
          @if (m.paid) {
            <div class="notice">
              <strong>Платный материал.</strong>
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
  protected readonly rating = signal<'LIKE' | 'DISLIKE' | null>(null);

  protected readonly format = formatLabel;
  protected readonly duration = durationLabel;
  protected readonly level = levelLabel;

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

  protected rate(rating: 'LIKE' | 'DISLIKE'): void {
    if (this.rating() === rating) {
      return;
    }

    this.rating.set(rating);
    this.track(rating);
  }

  protected track(type: EventType): void {
    const position = this.pos();

    this.events.track([
      {
        type,
        materialId: this.id(),
        recommendationId: this.rid() ?? null,
        variant: this.variant() ?? null,
        position: position === undefined || Number.isNaN(Number(position)) ? null : Number(position),
        surface: this.surface() ?? 'material',
      },
    ]);
  }
}

import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { Reaction, RecommendationItem, RecommendationList, UserEvent } from '../core/api.models';
import { EventsService } from '../core/events.service';
import { ProfileService } from '../core/profile.service';
import { RecommendationService } from '../core/recommendation.service';
import { MaterialCard } from '../shared/material-card';

@Component({
  selector: 'app-home-page',
  imports: [MaterialCard, RouterLink],
  template: `
    <section class="hero">
      <div class="container">
        <p class="hero-eyebrow">Здравствуйте, {{ profile()?.nickname }}</p>
        @if (profile()?.goal; as goal) {
          <h1>Подборка <span class="accent">под вашу задачу</span></h1>
          <p class="hero-goal">«{{ goal }}» · <a routerLink="/profile">изменить</a></p>
        } @else {
          <h1>Подборка <span class="accent">для старта</span></h1>
          <p class="hero-goal"><a routerLink="/profile">Опишите задачу</a>, и подборка станет точнее</p>
        }
      </div>
    </section>
    <div class="container page stack">
      @if (loading()) {
        @for (placeholder of [1, 2, 3]; track placeholder) {
          <div class="card skeleton" aria-hidden="true"></div>
        }
      } @else if (failed()) {
        <div class="notice">
          Не получилось загрузить подборку.
          <button class="btn btn-ghost btn-small" type="button" (click)="load()">Повторить</button>
        </div>
      } @else if (list(); as current) {
        @if (note()) {
          <p class="notice notice-done" role="status">{{ note() }}</p>
        }
        @if (current.engine === 'baseline') {
          <p class="notice notice-quiet">ИИ-подбор сейчас недоступен, поэтому показываем материалы, подходящие по теме.</p>
        }
        @if (current.clarifyingQuestion) {
          <div class="notice">
            <strong>Уточните, пожалуйста:</strong> {{ current.clarifyingQuestion }}
            <a routerLink="/profile">Ответить</a>
          </div>
        }
        @if (current.orderExplanation) {
          <p class="reason order-note"><span class="reason-label">Почему такой порядок</span>{{ current.orderExplanation }}</p>
        }
        @if (refreshing()) {
          <p class="muted" role="status">Обновляем подборку с учётом вашей оценки…</p>
        }
        @for (item of current.items; track item.material.id) {
          <app-material-card
            [material]="item.material"
            [reason]="item.reason"
            [nextStep]="item.nextStep"
            [context]="context(current, item)"
            [step]="item.position + 1"
            [fresh]="fresh().has(item.material.id)"
            [rateable]="true"
            [reaction]="reactions()[item.material.id] ?? null"
            [busy]="refreshing()"
            (opened)="opened(current, item)"
            (reacted)="react(current, item, $event)"
          />
        } @empty {
          <p class="muted">Пока нечего предложить. Попробуйте <a routerLink="/search">поиск</a>.</p>
        }
      }
    </div>
  `,
})
export class HomePage {
  private readonly recommendations = inject(RecommendationService);
  private readonly events = inject(EventsService);

  protected readonly profile = inject(ProfileService).profile;
  protected readonly reactions = this.events.reactions;
  protected readonly list = signal<RecommendationList | null>(null);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  protected readonly refreshing = signal(false);
  /** Materials that came into the list after the last rating. */
  protected readonly fresh = signal<ReadonlySet<string>>(new Set());
  protected readonly note = signal<string | null>(null);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.failed.set(false);

    this.recommendations.getRecommendations().subscribe({
      next: (list) => {
        this.show(list);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.failed.set(true);
      },
    });
  }

  /**
   * Saves the rating, then asks for the list again: a disliked material leaves it, and a liked one brings similar
   * materials. Materials new to the list are marked.
   */
  protected react(list: RecommendationList, item: RecommendationItem, reaction: Reaction): void {
    if (this.refreshing() || this.reactions()[item.material.id] === reaction) {
      return;
    }

    const before = new Set(list.items.map((shown) => shown.material.id));
    this.refreshing.set(true);
    this.note.set(null);

    this.events
      .react({ ...this.event(reaction, list, item), type: reaction })
      .pipe(switchMap(() => this.recommendations.getRecommendations()))
      .subscribe({
        next: (updated) => {
          this.fresh.set(new Set(updated.items.map((shown) => shown.material.id).filter((id) => !before.has(id))));
          this.note.set(
            reaction === 'LIKE'
              ? `Учли, что материал «${item.material.title}» вам полезен, и обновили подборку.`
              : `Убрали «${item.material.title}» и обновили подборку.`,
          );
          this.show(updated);
          this.refreshing.set(false);
        },
        error: () => {
          this.note.set('Оценку сохранили, но обновить подборку не получилось. Обновите страницу.');
          this.refreshing.set(false);
        },
      });
  }

  protected context(list: RecommendationList, item: RecommendationItem): Record<string, string | number> {
    return { rid: list.recommendationId, variant: list.variant, pos: item.position, surface: 'home' };
  }

  protected opened(list: RecommendationList, item: RecommendationItem): void {
    this.events.track([this.event('CLICK', list, item)]);
  }

  private show(list: RecommendationList): void {
    this.list.set(list);
    this.events.track(list.items.map((item) => this.event('IMPRESSION', list, item)));
  }

  private event(type: UserEvent['type'], list: RecommendationList, item: RecommendationItem): UserEvent {
    return {
      type,
      materialId: item.material.id,
      recommendationId: list.recommendationId,
      variant: list.variant,
      position: item.position,
      surface: 'home',
    };
  }
}

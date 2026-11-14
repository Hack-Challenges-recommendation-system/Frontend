import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RecommendationItem, RecommendationList, UserEvent } from '../core/api.models';
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
        <h1>Подборка <span class="accent">под вашу задачу</span></h1>
        @if (profile()?.goal; as goal) {
          <p class="hero-goal">«{{ goal }}» · <a routerLink="/profile">изменить</a></p>
        } @else {
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
        @if (current.engine === 'baseline') {
          <p class="notice notice-quiet">ИИ-подбор сейчас недоступен, поэтому показываем материалы, подходящие по теме.</p>
        }
        @if (current.clarifyingQuestion) {
          <div class="notice">
            <strong>Уточните, пожалуйста:</strong> {{ current.clarifyingQuestion }}
            <a routerLink="/profile">Ответить</a>
          </div>
        }
        @for (item of current.items; track item.material.id) {
          <app-material-card
            [material]="item.material"
            [reason]="item.reason"
            [nextStep]="item.nextStep"
            [context]="context(current, item)"
            (opened)="opened(current, item)"
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
  protected readonly list = signal<RecommendationList | null>(null);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.failed.set(false);

    this.recommendations.getRecommendations().subscribe({
      next: (list) => {
        this.list.set(list);
        this.loading.set(false);
        this.events.track(list.items.map((item) => this.event('IMPRESSION', list, item)));
      },
      error: () => {
        this.loading.set(false);
        this.failed.set(true);
      },
    });
  }

  protected context(list: RecommendationList, item: RecommendationItem): Record<string, string | number> {
    return { rid: list.recommendationId, variant: list.variant, pos: item.position, surface: 'home' };
  }

  protected opened(list: RecommendationList, item: RecommendationItem): void {
    this.events.track([this.event('CLICK', list, item)]);
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

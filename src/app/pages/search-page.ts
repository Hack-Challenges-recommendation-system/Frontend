import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MaterialSearchResult } from '../core/api.models';
import { CatalogService } from '../core/catalog.service';
import { EventsService } from '../core/events.service';
import { MaterialCard } from '../shared/material-card';

@Component({
  selector: 'app-search-page',
  imports: [ReactiveFormsModule, MaterialCard],
  template: `
    <section class="hero hero-compact">
      <div class="container">
        <h1>Поиск <span class="accent">по материалам</span></h1>
        <form class="search-form" role="search" [formGroup]="form" (ngSubmit)="search()">
          <input
            class="input"
            type="search"
            formControlName="query"
            placeholder="Например: налоги для ИП"
            aria-label="Что вы ищете"
          />
          <button class="btn btn-primary" type="submit">Найти</button>
        </form>
      </div>
    </section>
    <div class="container page stack">
      @for (result of results(); track result.material.id) {
        <app-material-card
          [material]="result.material"
          [context]="{ surface: 'search', pos: $index }"
          (opened)="opened(result.material.id, $index)"
        />
      } @empty {
        @if (searched()) {
          <p class="muted">Ничего не нашлось. Попробуйте другие слова.</p>
        }
      }
    </div>
  `,
})
export class SearchPage {
  private readonly catalog = inject(CatalogService);
  private readonly events = inject(EventsService);

  protected readonly form = new FormGroup({ query: new FormControl('', { nonNullable: true }) });
  protected readonly results = signal<MaterialSearchResult[]>([]);
  protected readonly searched = signal(false);

  protected search(): void {
    const query = this.form.controls.query.value.trim();
    if (!query) {
      return;
    }

    this.catalog.search(query).subscribe({
      next: (results) => {
        this.results.set(results);
        this.searched.set(true);
      },
      error: () => {
        this.results.set([]);
        this.searched.set(true);
      },
    });
  }

  protected opened(materialId: string, position: number): void {
    this.events.track([{ type: 'CLICK', materialId, position, surface: 'search' }]);
  }
}

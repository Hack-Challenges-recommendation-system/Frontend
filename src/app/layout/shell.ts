import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/** Frame of the signed-in screens: top bar on wide screens, bottom bar on phones. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="topbar">
      <div class="container topbar-inner">
        <a routerLink="/" class="brand">Знания <span class="accent">в нужный момент</span></a>
        <nav class="topnav" aria-label="Разделы">
          @for (item of nav; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: item.exact }">
              {{ item.label }}
            </a>
          }
        </nav>
      </div>
    </header>

    <main class="main">
      <router-outlet />
    </main>

    <nav class="bottomnav" aria-label="Разделы">
      @for (item of nav; track item.path) {
        <a [routerLink]="item.path" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: item.exact }">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="item.icon" /></svg>
          {{ item.label }}
        </a>
      }
    </nav>
  `,
})
export class Shell {
  protected readonly nav = [
    { path: '/', label: 'Подборка', exact: true, icon: 'M12 2l2.6 6.9L22 9.3l-5.6 4.7L18.2 21 12 17.2 5.8 21l1.8-7L2 9.3l7.4-.4z' },
    {
      path: '/search',
      label: 'Поиск',
      exact: false,
      icon: 'M10.5 3a7.5 7.5 0 0 1 5.9 12.1l4.8 4.8-1.4 1.4-4.8-4.8A7.5 7.5 0 1 1 10.5 3zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z',
    },
    {
      path: '/profile',
      label: 'Профиль',
      exact: false,
      icon: 'M12 3a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 11c4.4 0 8 2.2 8 5v2H4v-2c0-2.8 3.6-5 8-5z',
    },
  ];
}

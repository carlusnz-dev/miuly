import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Header } from './components/layout/header/header';
import { Sidebar } from './components/layout/sidebar/sidebar';
import { Brand } from './components/ui/brand/brand';
import { MeshGradient } from './components/ui/mesh-gradient/mesh-gradient';
import { useSession } from './modules/auth/session';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Sidebar, Brand, MeshGradient],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly session = useSession();
  private readonly router = inject(Router);
  readonly authPage = signal(this.isAuthRoute(this.router.url));

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => this.authPage.set(this.isAuthRoute(event.urlAfterRedirects)));
  }

  private isAuthRoute(url: string): boolean {
    return /^\/(login|cadastro)([/?#]|$)/.test(url);
  }
}

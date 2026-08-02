import { TuiRoot } from '@taiga-ui/core';
import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Auth } from './core/auth/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TuiRoot],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('frontend');

  private readonly auth = inject(Auth);

  constructor() {
    this.auth.me().subscribe({
      next: (res) => console.log('OK', res.data),
      error: (err) => console.log('ERROR', err.status, err.error),
    });
  }
}

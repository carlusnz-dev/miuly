import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Brand } from '../../ui/brand/brand';
import { useSession } from '../../../modules/auth/session';

@Component({
  selector: 'app-header',
  imports: [Brand, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly router = inject(Router);
  readonly session = useSession();
  readonly signingOut = signal(false);
  readonly logoutError = signal(false);

  async logout(): Promise<void> {
    if (this.signingOut()) return;
    this.signingOut.set(true);
    this.logoutError.set(false);
    try {
      await this.session.logout();
      await this.router.navigateByUrl('/login');
    } catch {
      this.logoutError.set(true);
    } finally {
      this.signingOut.set(false);
    }
  }
}

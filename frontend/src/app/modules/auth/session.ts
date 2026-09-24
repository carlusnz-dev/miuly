import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  AuthApi,
  AuthSessionDto,
  AuthUserDto,
  LoginInput,
  RegisterInput,
} from '../../api/auth.api';

export type SessionStatus = 'checking' | 'authenticated' | 'anonymous' | 'unavailable';

@Injectable({ providedIn: 'root' })
export class Session {
  private readonly api = inject(AuthApi);
  private readonly statusSignal = signal<SessionStatus>('checking');
  private readonly userSignal = signal<AuthUserDto | null>(null);
  private accessToken: string | null = null;
  private refreshInFlight: Promise<string | null> | null = null;
  private restoreStarted = false;
  private revision = 0;

  readonly status = this.statusSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.statusSignal() === 'authenticated');

  token(): string | null {
    return this.accessToken;
  }

  ensureRestored(): void {
    if (this.restoreStarted) return;
    this.restoreStarted = true;
    this.retryRestore();
  }

  retryRestore(): void {
    const revision = this.revision;
    this.statusSignal.set('checking');
    void this.refresh().catch((error: unknown) => {
      if (
        revision === this.revision &&
        (!(error instanceof HttpErrorResponse) || error.status !== 401)
      ) {
        this.statusSignal.set('unavailable');
      }
    });
  }

  async login(input: LoginInput): Promise<void> {
    const result = await firstValueFrom(this.api.login(input));
    this.revision++;
    this.accept(result.data);
  }

  async register(input: RegisterInput): Promise<void> {
    const result = await firstValueFrom(this.api.register(input));
    this.revision++;
    this.accept(result.data);
  }

  refresh(): Promise<string | null> {
    if (this.refreshInFlight) return this.refreshInFlight;
    const revision = this.revision;
    const request = this.requestRefresh(revision);
    this.refreshInFlight = request.finally(() => {
      this.refreshInFlight = null;
    });
    return this.refreshInFlight;
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.api.logout());
    this.clear();
  }

  clear(): void {
    this.revision++;
    this.accessToken = null;
    this.userSignal.set(null);
    this.statusSignal.set('anonymous');
  }

  private async requestRefresh(revision: number): Promise<string | null> {
    try {
      let result: AuthSessionDto;
      try {
        result = (await firstValueFrom(this.api.refresh())).data;
      } catch (error) {
        if (!(error instanceof HttpErrorResponse) || error.status !== 409) throw error;
        result = (await firstValueFrom(this.api.refresh())).data;
      }
      if (revision !== this.revision) return null;
      this.accept(result);
      return result.accessToken;
    } catch (error) {
      if (
        revision === this.revision &&
        error instanceof HttpErrorResponse &&
        error.status === 401
      ) {
        this.clear();
      }
      throw error;
    }
  }

  private accept(result: AuthSessionDto): void {
    this.accessToken = result.accessToken;
    this.userSignal.set(result.user);
    this.statusSignal.set('authenticated');
  }
}

/** Hook Angular para leitura granular dos signals de sessão em componentes. */
export function useSession(): Session {
  const session = inject(Session);
  session.ensureRestored();
  return session;
}

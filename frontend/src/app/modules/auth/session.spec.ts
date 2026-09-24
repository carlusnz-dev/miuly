import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Session } from './session';

const user = {
  id: 1,
  name: 'Ana',
  email: 'ana@example.com',
  profile: { id: 'profile-1', username: 'ana', slugUrl: 'ana', urlPhoto: null },
};

function response(token: string) {
  return {
    ok: true,
    message: 'Sessão renovada',
    data: {
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: 900,
      user,
    },
  };
}

describe('Session', () => {
  let session: Session;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    session = TestBed.inject(Session);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('compartilha o refresh e restaura sessão apenas em memória', async () => {
    const first = session.refresh();
    const second = session.refresh();
    expect(first).toBe(second);
    expect(session.token()).toBeNull();
    http.expectOne('/auth/refresh').flush(response('token-1'));

    expect(await first).toBe('token-1');
    expect(session.status()).toBe('authenticated');
    expect(session.user()?.name).toBe('Ana');
    expect(session.token()).toBe('token-1');
  });

  it('repete uma vez o refresh quando outra aba recebeu o cookie novo', async () => {
    const result = session.refresh();
    http
      .expectOne('/auth/refresh')
      .flush({ ok: false, message: 'Conflito' }, { status: 409, statusText: 'Conflict' });
    await Promise.resolve();
    http.expectOne('/auth/refresh').flush(response('token-2'));
    expect(await result).toBe('token-2');
  });

  it('limpa o token após 401 no refresh', async () => {
    const login = session.login({ email: 'ana@example.com', password: 'segredo' });
    http.expectOne('/auth/login').flush(response('token-1'));
    await login;

    const refresh = session.refresh();
    http
      .expectOne('/auth/refresh')
      .flush({ ok: false, message: 'Expirou' }, { status: 401, statusText: 'Unauthorized' });
    await expect(refresh).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(session.status()).toBe('anonymous');
    expect(session.user()).toBeNull();
    expect(session.token()).toBeNull();
  });

  it('não restaura resultado antigo depois de logout', async () => {
    const refresh = session.refresh();
    session.clear();
    http.expectOne('/auth/refresh').flush(response('token-antigo'));
    expect(await refresh).toBeNull();
    expect(session.status()).toBe('anonymous');
    expect(session.token()).toBeNull();
  });

  it('permite repetir a verificação após falha de rede', async () => {
    session.ensureRestored();
    http.expectOne('/auth/refresh').flush(null, { status: 0, statusText: 'Network Error' });
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(session.status()).toBe('unavailable');

    session.retryRestore();
    expect(session.status()).toBe('checking');
    http.expectOne('/auth/refresh').flush(response('restaurado'));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(session.status()).toBe('authenticated');
    expect(session.token()).toBe('restaurado');
  });
});

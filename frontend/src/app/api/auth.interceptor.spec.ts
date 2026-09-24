import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Session } from '../modules/auth/session';
import { authInterceptor } from './auth.interceptor';

const user = {
  id: 1,
  name: 'Ana',
  email: 'ana@example.com',
  profile: { id: 'profile-1', username: 'ana', slugUrl: 'ana', urlPhoto: null },
};
const sessionResponse = (token: string) => ({
  ok: true,
  message: 'OK',
  data: { accessToken: token, tokenType: 'Bearer', expiresIn: 900, user },
});

describe('authInterceptor', () => {
  it('não envia o Bearer para uma URL externa', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    const session = TestBed.inject(Session);
    const http = TestBed.inject(HttpTestingController);
    const client = TestBed.inject(HttpClient);
    const login = session.login({ email: 'ana@example.com', password: 'segredo' });
    http.expectOne('/auth/login').flush(sessionResponse('privado'));
    await login;

    client.get('https://example.org/data').subscribe();
    const external = http.expectOne('https://example.org/data');
    expect(external.request.headers.has('Authorization')).toBe(false);
    external.flush({});
    http.verify();
  });

  it('anexa Bearer, renova após 401 e repete a requisição uma vez', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    const session = TestBed.inject(Session);
    const http = TestBed.inject(HttpTestingController);
    const client = TestBed.inject(HttpClient);

    const login = session.login({ email: 'ana@example.com', password: 'segredo' });
    const loginRequest = http.expectOne('/auth/login');
    expect(loginRequest.request.headers.has('Authorization')).toBe(false);
    loginRequest.flush(sessionResponse('antigo'));
    await login;

    let received: unknown;
    client.get('/tasks').subscribe((value) => (received = value));
    const initial = http.expectOne('/tasks');
    expect(initial.request.headers.get('Authorization')).toBe('Bearer antigo');
    initial.flush({ ok: false, message: 'Expirado' }, { status: 401, statusText: 'Unauthorized' });

    const refresh = http.expectOne('/auth/refresh');
    expect(refresh.request.withCredentials).toBe(true);
    expect(refresh.request.headers.has('Authorization')).toBe(false);
    refresh.flush(sessionResponse('novo'));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    const retried = http.expectOne('/tasks');
    expect(retried.request.headers.get('Authorization')).toBe('Bearer novo');
    retried.flush({ ok: true, message: 'OK', data: [] });
    expect(received).toEqual({ ok: true, message: 'OK', data: [] });
    http.verify();
  });
});

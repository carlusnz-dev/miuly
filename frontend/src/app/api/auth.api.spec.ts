import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthApi } from './auth.api';

describe('AuthApi', () => {
  it('envia credenciais ao cadastro e usa cookie no refresh', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const api = TestBed.inject(AuthApi);
    const http = TestBed.inject(HttpTestingController);

    api
      .register({ name: 'Ana', email: 'ana@example.com', username: 'ana', password: 'segredo123' })
      .subscribe();
    const register = http.expectOne('/auth/register');
    expect(register.request.method).toBe('POST');
    expect(register.request.withCredentials).toBe(true);
    expect(register.request.body).toEqual({
      name: 'Ana',
      email: 'ana@example.com',
      username: 'ana',
      password: 'segredo123',
    });
    register.flush({ ok: true, message: 'Conta criada', data: null });

    api.refresh().subscribe();
    const refresh = http.expectOne('/auth/refresh');
    expect(refresh.request.method).toBe('POST');
    expect(refresh.request.withCredentials).toBe(true);
    expect(refresh.request.body).toEqual({});
    refresh.flush({ ok: true, message: 'Sessão renovada', data: null });
    http.verify();
  });
});

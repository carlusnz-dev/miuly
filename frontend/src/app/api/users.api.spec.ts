import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UsersApi } from './users.api';

describe('UsersApi', () => {
  let api: UsersApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UsersApi, provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(UsersApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('gets the current user', () => {
    const response = {
      ok: true as const,
      message: 'Usuário encontrado',
      data: {
        id: 42,
        name: 'Ana',
        email: 'ana@example.com',
        createdAt: '2026-09-24T00:00:00.000Z',
        updatedAt: '2026-09-24T00:00:00.000Z',
      },
    };
    let received: typeof response | undefined;

    api.me().subscribe((result) => (received = result));

    const request = http.expectOne('/users/me');
    expect(request.request.method).toBe('GET');
    request.flush(response);
    expect(received).toEqual(response);
  });

  it('patches the current user name', () => {
    const body = { name: 'Ana Maria' };

    api.updateMe(body).subscribe();

    const request = http.expectOne('/users/me');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(body);
    request.flush({ ok: true, message: 'Usuário atualizado', data: {} });
  });

  it('changes the current user password', () => {
    const body = { currentPassword: 'old-password', newPassword: 'new-password' };

    api.changePassword(body).subscribe();

    const request = http.expectOne('/users/me/password');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(body);
    request.flush({ ok: true, message: 'Senha alterada', data: null });
  });

  it('gets the current user profile', () => {
    api.profile().subscribe();

    const request = http.expectOne('/users/me/profile');
    expect(request.request.method).toBe('GET');
    request.flush({ ok: true, message: 'Perfil encontrado', data: {} });
  });

  it('patches the current user profile', () => {
    const body = { username: 'ana_maria', bio: null, urlPhoto: 'https://example.com/ana.jpg' };

    api.updateProfile(body).subscribe();

    const request = http.expectOne('/users/me/profile');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(body);
    request.flush({ ok: true, message: 'Perfil atualizado', data: {} });
  });
});

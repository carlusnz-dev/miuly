import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UsersApi } from './users.api';

describe('UsersApi', () => {
  it('requests the backend route and preserves its response envelope', () => {
    TestBed.configureTestingModule({
      providers: [UsersApi, provideHttpClient(), provideHttpClientTesting()],
    });

    const api = TestBed.inject(UsersApi);
    const http = TestBed.inject(HttpTestingController);
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
    api.getById(42).subscribe((result) => (received = result));

    const request = http.expectOne('/users/42');
    expect(request.request.method).toBe('GET');
    request.flush(response);
    expect(received).toEqual(response);
    http.verify();
  });
});

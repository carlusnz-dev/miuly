import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiSuccess } from './http-response';

export interface AuthUserDto {
  id: number;
  name: string;
  email: string;
  profile: {
    id: string;
    username: string;
    slugUrl: string;
    urlPhoto: string | null;
  };
}

export interface AuthSessionDto {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: AuthUserDto;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name: string;
  username: string;
}

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);

  login(input: LoginInput): Observable<ApiSuccess<AuthSessionDto>> {
    return this.http.post<ApiSuccess<AuthSessionDto>>('/auth/login', input, {
      withCredentials: true,
    });
  }

  register(input: RegisterInput): Observable<ApiSuccess<AuthSessionDto>> {
    return this.http.post<ApiSuccess<AuthSessionDto>>('/auth/register', input, {
      withCredentials: true,
    });
  }

  refresh(): Observable<ApiSuccess<AuthSessionDto>> {
    return this.http.post<ApiSuccess<AuthSessionDto>>(
      '/auth/refresh',
      {},
      { withCredentials: true },
    );
  }

  logout(): Observable<ApiSuccess<null>> {
    return this.http.post<ApiSuccess<null>>('/auth/logout', {}, { withCredentials: true });
  }

  me(): Observable<ApiSuccess<AuthUserDto>> {
    return this.http.get<ApiSuccess<AuthUserDto>>('/auth/me', { withCredentials: true });
  }
}

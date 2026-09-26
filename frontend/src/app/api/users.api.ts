import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiSuccess } from './http-response';

/** DTO público de GET/PATCH /users/me; datas chegam como ISO 8601. */
export interface UserResponse {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

/** DTO público do perfil; datas chegam como ISO 8601. */
export interface ProfileResponse {
  id: string;
  username: string;
  slugUrl: string;
  bio: string | null;
  urlPhoto: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserInput {
  name?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileInput {
  username?: string;
  bio?: string | null;
  urlPhoto?: string | null;
}

@Injectable({ providedIn: 'root' })
export class UsersApi {
  private readonly http = inject(HttpClient);

  me(): Observable<ApiSuccess<UserResponse>> {
    return this.http.get<ApiSuccess<UserResponse>>('/users/me');
  }

  updateMe(input: UpdateUserInput): Observable<ApiSuccess<UserResponse>> {
    return this.http.patch<ApiSuccess<UserResponse>>('/users/me', input);
  }

  changePassword(input: ChangePasswordInput): Observable<ApiSuccess<null>> {
    return this.http.put<ApiSuccess<null>>('/users/me/password', input);
  }

  profile(): Observable<ApiSuccess<ProfileResponse>> {
    return this.http.get<ApiSuccess<ProfileResponse>>('/users/me/profile');
  }

  updateProfile(input: UpdateProfileInput): Observable<ApiSuccess<ProfileResponse>> {
    return this.http.patch<ApiSuccess<ProfileResponse>>('/users/me/profile', input);
  }
}

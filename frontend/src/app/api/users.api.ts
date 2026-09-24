import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiSuccess } from './http-response';

/** DTO público de GET /users/:id; datas chegam como ISO 8601. */
export interface UserDto {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class UsersApi {
  private readonly http = inject(HttpClient);

  getById(id: number): Observable<ApiSuccess<UserDto>> {
    return this.http.get<ApiSuccess<UserDto>>(`/users/${id}`);
  }
}

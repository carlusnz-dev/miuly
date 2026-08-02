import { HttpClient } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { SignUpRequest, User } from '../models/user.model';
import { Observable, tap } from 'rxjs';
import { ApiMsg, ApiOk } from '../models/api.model';

type inputTypes = 'email' | 'username';

@Service()
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;
  private readonly baseUserUrl = `${environment.apiUrl}/user`;

  // signal do usuário atual
  private readonly _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();

  // auth/me
  me(): Observable<ApiOk<User>> {
    return this.http
      .get<ApiOk<User>>(`${this.baseUrl}/me`)
      .pipe(tap((res) => this._currentUser.set(res.data)));
  }

  // login
  login(identifier: string, password: string): Observable<ApiMsg> {
    const isEmail = this.verifyInput(identifier) === 'email';
    return this.http.post<ApiMsg>(`${this.baseUrl}/login`, {
      ...(isEmail ? { email: identifier } : { username: identifier }),
      password,
    });
  }

  // signup
  signUp(data: SignUpRequest): Observable<ApiOk<SignUpRequest>> {
    const { username, email, password } = data;
    return this.http.post<ApiOk<SignUpRequest>>(`${this.baseUserUrl}/`, {
      username,
      email,
      password,
    });
  }

  // logout
  logout(): Observable<ApiMsg> {
    return this.http
      .post<ApiMsg>(`${this.baseUrl}/logout`, {})
      .pipe(tap(() => this._currentUser.set(null)));
  }

  verifyInput(input: string): inputTypes {
    if (input.includes('@')) {
      return 'email';
    } else {
      return 'username';
    }
  }
}

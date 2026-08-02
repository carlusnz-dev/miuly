export interface User {
  id: number;
  email: string;
  username: string;
  role: Role;
  created_at: string;
  updated_at: string;
}

export type Role = 'USER' | 'ADMIN';

export interface LoginRequest {
  username?: string;
  email?: string;
  password: string;
}

export interface SignUpRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

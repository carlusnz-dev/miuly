// Identidade do usuário autenticado, anexada à requisição pelo middleware de
// autenticação e repassada aos services pelo handler HTTP.
export interface AuthContext {
  userId: number;
  profileId: string;
}

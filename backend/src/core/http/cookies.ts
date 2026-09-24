export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax';
  path: string;
  maxAge?: number;
}

// Instrução declarada pelo controller e aplicada pelo handler, para que o
// controller não manipule Response.
export type CookieInstruction =
  | { name: string; value: string; options: CookieOptions }
  | { name: string; clear: true; options: CookieOptions };

export function parseCookies(
  header: string | undefined,
): Record<string, string> {
  const cookies: Record<string, string> = {};

  if (!header) {
    return cookies;
  }

  for (const part of header.split(';')) {
    const separator = part.indexOf('=');

    if (separator <= 0) {
      continue;
    }

    const name = part.slice(0, separator).trim();
    const raw = part.slice(separator + 1).trim();

    try {
      cookies[name] = decodeURIComponent(raw);
    } catch {
      // Valor com escape inválido é ignorado, como se o cookie não existisse.
    }
  }

  return cookies;
}

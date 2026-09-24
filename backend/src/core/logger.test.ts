import { afterEach, describe, expect, it, vi } from 'vitest';
import { Logger } from './logger';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Logger', () => {
  it('preserva a mensagem quando o path é longo', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const path = `/users/${'a'.repeat(500)}`;

    new Logger().error('stack do erro', {
      method: 'GET',
      path,
      statusCode: 500,
    });

    const output = String(log.mock.calls[0]?.[0]);
    expect(output).toContain('[ERROR] - GET');
    expect(output).toContain(path);
    expect(output).toContain('stack do erro');
  });
});

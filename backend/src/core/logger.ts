import type { NextFunction, Request, Response } from 'express';
import * as z from 'zod';

export type LOG_TYPE = 'INFO' | 'ERROR' | 'DEBUG' | 'WARN';

export interface logsMeta {
  logType?: LOG_TYPE;
  statusCode?: number;
  path?: string;
  method?: string;
  timestamp?: string;
}

const schemaMessage = z.object({
  method: z.string().uppercase().min(3).optional(),
  path: z.string().max(2048).optional(),
  timestamp: z.string().optional(),
});

export class Logger {
  private formatterMessage(message: string, meta?: logsMeta): string {
    if (meta) {
      const parse = schemaMessage.safeParse(meta);

      if (!parse.success) {
        return 'Detalhes do log estão mal formatados';
      }
    }

    const timestamp = meta?.timestamp || new Date().toISOString();
    const type = meta?.logType || 'INFO';

    if (!meta || (!meta.method && !meta.path && !meta.statusCode)) {
      return `${timestamp} [${type}] - ${message}`;
    }

    const formatted = `${timestamp} [${meta.logType}] - ${meta.method} ${meta.path} ${meta.statusCode} ${message}`;

    return formatted;
  }

  info(message: string, meta?: logsMeta): void {
    const log = this.formatterMessage(message, {
      ...meta,
      logType: 'INFO',
    });
    console.info(log);
  }

  error(message: string, meta?: logsMeta): void {
    const log = this.formatterMessage(message, {
      ...meta,
      logType: 'ERROR',
    });
    console.error(log);
  }

  warn(message: string, meta?: logsMeta): void {
    const log = this.formatterMessage(message, {
      ...meta,
      logType: 'WARN',
    });
    console.warn(log);
  }

  debug(message: string, meta?: logsMeta): void {
    const log = this.formatterMessage(message, {
      ...meta,
      logType: 'DEBUG',
    });
    console.debug(log);
  }

  expressMiddleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      res.on('finish', () => {
        this.info('Request completed', {
          statusCode: res.statusCode,
          method: `${req.method}`,
          path: req.originalUrl,
          logType: 'INFO',
        });
      });

      next();
    };
  }
}

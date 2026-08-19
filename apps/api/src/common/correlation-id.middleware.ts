import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

export class CorrelationIdMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const suppliedId = request.header(CORRELATION_ID_HEADER);
    const correlationId = suppliedId?.trim() || randomUUID();

    response.locals.correlationId = correlationId;
    response.setHeader(CORRELATION_ID_HEADER, correlationId);
    next();
  }
}

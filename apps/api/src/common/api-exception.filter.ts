import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { ApiErrorResponse } from '@estudio-tecnico/contracts';
import type { Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const validationDetails =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? exceptionResponse
        : undefined;

    const body: ApiErrorResponse = {
      code: status === 400 ? 'VALIDATION_ERROR' : 'API_ERROR',
      message:
        status === 500
          ? 'Se produjo un error interno.'
          : exception instanceof Error
            ? exception.message
            : 'La solicitud no pudo completarse.',
      correlationId: String(response.locals.correlationId ?? 'unavailable'),
      ...(validationDetails ? { details: validationDetails } : {}),
    };

    response.status(status).json(body);
  }
}

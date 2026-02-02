/**
 * 전역 HTTP 예외 필터
 *
 * 【학습 개념: Exception Filter】
 *
 * NestJS의 예외 필터는 애플리케이션의 모든 예외를 처리합니다:
 * - 일관된 에러 응답 형식
 * - 개발/운영 환경별 상세도 조절
 * - 로깅 및 모니터링
 *
 * 【보안 개념: 에러 정보 노출】
 *
 * 운영 환경에서는 상세한 에러 정보를 숨깁니다:
 * - 스택 트레이스 노출 금지
 * - 내부 에러 메시지 대신 일반 메시지
 * - 공격자에게 힌트를 주지 않음
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // HTTP 상태 코드 결정
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // 에러 메시지 추출
    let message: string | string[];

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        // ValidationPipe 에러 형식 처리
        message =
          (exceptionResponse as any).message || exception.message;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    } else {
      message = '알 수 없는 오류가 발생했습니다';
    }

    // 개발 환경에서만 상세 로깅
    if (process.env.NODE_ENV === 'development') {
      this.logger.error(
        `${request.method} ${request.url} - ${status}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    // 응답 형식
    const errorResponse = {
      success: false,
      error: {
        statusCode: status,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
        // 개발 환경에서만 스택 트레이스 포함
        ...(process.env.NODE_ENV === 'development' &&
          exception instanceof Error && {
            stack: exception.stack,
          }),
      },
    };

    response.status(status).json(errorResponse);
  }
}

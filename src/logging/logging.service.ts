import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface ApiLogPayload {
  method: string;
  path: string;
  statusCode?: number;
  durationMs?: number;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  headers?: unknown;
  query?: unknown;
  requestBody?: unknown;
  responseBody?: unknown;
  error?: unknown;
}

@Injectable()
export class LoggingService {
  private readonly logger = new Logger(LoggingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(payload: ApiLogPayload): Promise<void> {
    try {
      await this.prisma.apiLog.create({
        data: {
          method: payload.method,
          path: payload.path,
          statusCode: payload.statusCode,
          durationMs: payload.durationMs,
          requestId: payload.requestId,
          ip: payload.ip,
          userAgent: payload.userAgent,
          headers: this.serialize(payload.headers),
          query: this.serialize(payload.query),
          requestBody: this.serialize(payload.requestBody),
          responseBody: this.serialize(payload.responseBody),
          error: this.serialize(payload.error),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        this.logger.error(`Failed to persist API log (code: ${error.code})`, error.stack);
        return;
      }

      if (error instanceof Prisma.PrismaClientInitializationError) {
        this.logger.error('Prisma initialization error while logging API call', error.stack);
        return;
      }

      this.logger.error(
        'Failed to persist API log',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async logSuccess(payload: ApiLogPayload): Promise<void> {
    await this.log(payload);
  }

  async logError(payload: ApiLogPayload): Promise<void> {
    await this.log(payload);
  }

  private serialize(value: unknown): Prisma.JsonValue | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    try {
      const serialized = JSON.parse(
        JSON.stringify(value, (_key, val) => {
          if (typeof val === 'bigint') {
            return val.toString();
          }
          if (val instanceof Buffer) {
            return val.toString('base64');
          }
          return val;
        }),
      );

      return serialized as Prisma.JsonValue;
    } catch (error) {
      this.logger.warn(`Unable to serialize value for API log: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }
}


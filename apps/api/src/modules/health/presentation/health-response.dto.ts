import { ApiProperty } from '@nestjs/swagger';
import type { HealthResponse } from '@estudio-tecnico/contracts';

export class HealthResponseDto implements HealthResponse {
  @ApiProperty({ example: 'ok' })
  status!: 'ok';

  @ApiProperty({ example: 'up' })
  database!: 'up';

  @ApiProperty({ example: '2026-08-19T18:00:00.000Z' })
  timestamp!: string;
}

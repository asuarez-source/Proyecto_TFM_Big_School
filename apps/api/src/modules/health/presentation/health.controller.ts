import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { HealthResponse } from '@estudio-tecnico/contracts';
import { HealthService } from '../application/health.service';
import { HealthResponseDto } from './health-response.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Comprueba la API y la conexión con MySQL' })
  @ApiOkResponse({
    description: 'La API y MySQL están disponibles.',
    type: HealthResponseDto,
  })
  check(): Promise<HealthResponse> {
    return this.healthService.check();
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { CanbusCandidateResponse } from '@estudio-tecnico/contracts';
import { FindCanbusCandidatesService } from '../application/find-canbus-candidates.service';
import { FindCanbusCandidatesDto } from './find-canbus-candidates.dto';
import { CanbusCandidateResponseDto } from './canbus-candidate-response.dto';

@ApiTags('canbus-catalog')
@Controller('canbus-catalog')
export class CanbusCatalogController {
  constructor(private readonly findCandidates: FindCanbusCandidatesService) {}

  @Get('candidates')
  @ApiOperation({
    summary: 'Selecciona candidatos documentales CANBus sin ejecutar OCR',
    description:
      'MATCHED identifica únicamente una selección documental inequívoca; no confirma por sí mismo la compatibilidad del vehículo.',
  })
  @ApiOkResponse({
    description:
      'Resultado de selección, documento elegido cuando es inequívoco y advertencias de importación.',
    type: CanbusCandidateResponseDto,
  })
  getCandidates(
    @Query() query: FindCanbusCandidatesDto,
  ): Promise<CanbusCandidateResponse> {
    return this.findCandidates.execute(query);
  }
}

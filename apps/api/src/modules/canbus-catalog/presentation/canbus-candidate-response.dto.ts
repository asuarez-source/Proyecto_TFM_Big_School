import { ApiProperty } from '@nestjs/swagger';
import type {
  CanbusCandidate,
  CanbusCandidateWarning,
  CanbusCandidateQualifier,
  CanbusCandidateResponse,
  CanbusDecisionCode,
  CanbusSelectionStatus,
} from '@estudio-tecnico/contracts';

class CanbusCandidateQualifierDto implements CanbusCandidateQualifier {
  @ApiProperty({ nullable: true, example: 'ACCESS_SYSTEM' })
  type!: string | null;

  @ApiProperty({ example: 'Regular-key' })
  originalValue!: string;

  @ApiProperty({ nullable: true, example: 'Regular-key' })
  canonicalValue!: string | null;
}

class CanbusCandidateWarningDto implements CanbusCandidateWarning {
  @ApiProperty({ example: 'UNCLASSIFIED_QUALIFIER' })
  code!: string;

  @ApiProperty()
  message!: string;
}

class CanbusCandidateDto implements CanbusCandidate {
  @ApiProperty({ example: '3040' })
  documentId!: string;

  @ApiProperty({ example: 'SEAT_ARONA_KJ_2018_Regular-key_en.pdf' })
  originalFilename!: string;

  @ApiProperty({ example: 'ARONA_KJ' })
  vehicleDescriptor!: string;

  @ApiProperty({ nullable: true, example: 2018 })
  startYear!: number | null;

  @ApiProperty({ example: 'OK' })
  parseStatus!: string;

  @ApiProperty({ type: [CanbusCandidateQualifierDto] })
  qualifiers!: CanbusCandidateQualifierDto[];

  @ApiProperty({ type: [CanbusCandidateWarningDto] })
  warnings!: CanbusCandidateWarningDto[];
}

class NormalizedCanbusInputDto {
  @ApiProperty({ example: 'seat' })
  manufacturer!: string;

  @ApiProperty({ example: 'arona_kj' })
  model!: string;

  @ApiProperty({ example: 2020 })
  year!: number;
}

export class CanbusCandidateResponseDto implements CanbusCandidateResponse {
  @ApiProperty({ enum: ['MATCHED', 'REVIEW_REQUIRED', 'NOT_FOUND'] })
  status!: CanbusSelectionStatus;

  @ApiProperty({
    example:
      'Se seleccionó el esquema más reciente que comienza antes del año indicado.',
  })
  reason!: string;

  @ApiProperty({ example: ['YEAR_INTERVAL_MATCH', 'DESCRIPTOR_MATCH'] })
  decisionCodes!: CanbusDecisionCode[];

  @ApiProperty({ type: NormalizedCanbusInputDto })
  normalizedInput!: NormalizedCanbusInputDto;

  @ApiProperty({ type: [CanbusCandidateDto] })
  candidates!: CanbusCandidateDto[];

  @ApiProperty({ type: CanbusCandidateDto, nullable: true })
  selectedDocument!: CanbusCandidateDto | null;
}

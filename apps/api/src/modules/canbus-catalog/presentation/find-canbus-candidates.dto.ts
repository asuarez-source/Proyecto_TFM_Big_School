import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { CanbusCandidateQuery } from '@estudio-tecnico/contracts';

export class FindCanbusCandidatesDto implements CanbusCandidateQuery {
  @ApiProperty({ example: 'SEAT', maxLength: 120 })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  manufacturer!: string;

  @ApiProperty({ example: 'ARONA KJ', maxLength: 180 })
  @IsString()
  @MinLength(1)
  @MaxLength(180)
  model!: string;

  @ApiProperty({ example: 2020, minimum: 1, maximum: 65535 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  year!: number;

  @ApiPropertyOptional({ maxLength: 40 })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  vin?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  propulsion?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  market?: string;

  @ApiPropertyOptional({ maxLength: 150, example: 'Regular-key' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  accessSystem?: string;
}

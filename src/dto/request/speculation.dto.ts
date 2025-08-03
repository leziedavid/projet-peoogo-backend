import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class SpeculationDto {
  @ApiProperty({
    example: ['Maïs', 'Cacao'],
    description: 'Liste des spéculations à créer',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [value];
      }
    }
    if (Array.isArray(value)) return value;
    return [value];
  })
  nom: string[];
}

export class CreateSpeculationDto extends OmitType(SpeculationDto, [] as const) {}

export class UpdateSpeculationDto {
  @ApiPropertyOptional({ example: 'Maïs', description: 'Nom de la spéculation' })
  @IsString()
  @IsOptional()
  nom?: string;
}
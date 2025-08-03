import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class ActiviteDto {
    @ApiProperty({
        example: ['Agriculture', 'Pêche'],
        description: 'Liste des noms des activités à créer',
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

export class CreateActiviteDto extends OmitType(ActiviteDto, [] as const) { }

export class UpdateActiviteDto {
    @ApiPropertyOptional({ example: 'Agriculture', description: 'Nom de l’activité' })
    @IsString()
    @IsOptional()
    nom?: string;
}

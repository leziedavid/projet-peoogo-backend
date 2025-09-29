import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum CategorieStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
}

export class CategorieDto {
    @ApiProperty({
        example: ['Céréales', 'Légumes'],
        description: 'Liste des noms des catégories à créer',
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

    @ApiPropertyOptional({
        enum: CategorieStatus,
        example: CategorieStatus.ACTIVE,
        description: 'Statut de la catégorie',
    })
    @IsEnum(CategorieStatus)
    @IsOptional()
    status?: CategorieStatus;
}

export class CreateCategorieDto extends OmitType(CategorieDto, [] as const) { }

export class UpdateCategorieDto {
    @ApiPropertyOptional({ example: 'Céréales', description: 'Nom de la catégorie' })
    @IsString()
    @IsOptional()
    nom?: string;

    @ApiPropertyOptional({
        enum: CategorieStatus,
        example: CategorieStatus.ACTIVE,
        description: 'Statut de la catégorie',
    })
    @IsEnum(CategorieStatus)
    @IsOptional()
    status?: CategorieStatus;
}

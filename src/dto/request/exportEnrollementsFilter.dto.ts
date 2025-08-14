    
    import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum, IsBoolean, IsDate, IsNumber, IsUUID, ValidateNested } from 'class-validator';
import { NiveauInstruction, StatusDossier,TypeCompte} from '@prisma/client';
import { Type } from 'class-transformer';

export class EnrollementsFilterDto {
    @ApiPropertyOptional({ description: 'Filtre les enrôlements par statut dossier', enum: StatusDossier, example: StatusDossier.NON_TRAITE })
    @IsOptional()
    @IsEnum(StatusDossier)
    statusDossier?: StatusDossier;

    @ApiPropertyOptional({ description: 'Filtre les enrôlements par date de début', example: '2024-08-01T10:15:00Z' })
    @IsOptional()
    @IsDate()
    startDate?: Date;

    @ApiPropertyOptional({ description: 'Filtre les enrôlements par date de fin', example: '2024-08-01T10:15:00Z' })
    @IsOptional()
    @IsDate()
    endDate?: Date;
}
    // statusDossier?: string;
    // startDate?: string; // ISO string
    // endDate?: string;   // ISO string


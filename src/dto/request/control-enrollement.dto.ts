import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatusDossier } from '@prisma/client';

export class ControlEnrollementDto {
    @IsEnum(StatusDossier)
    status_dossier: StatusDossier;

    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ example: 'Justification du contrôle ou du rejet' })
    commentaire?: string;

    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ example: 'LOT-2025-001' })
    numeroLot?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsDateString } from 'class-validator';

export class EnrollementAdminFilterDto {
    
    @ApiPropertyOptional({
        description: 'Date de début de la période',
        example: '2024-01-01T00:00:00.000Z',
        type: String,
        format: 'date-time',
    })
    @IsOptional()
    @IsDateString()
    startDate?: Date;

    @ApiPropertyOptional({
        description: 'Date de fin de la période',
        example: '2024-12-31T23:59:59.000Z',
        type: String,
        format: 'date-time',
    })
    @IsOptional()
    @IsDateString()
    endDate?: Date;

    @ApiPropertyOptional({
        description: "ID de l'agent enrôleur",
        example: 'uuid-agent-enroleur',
    })
    @IsOptional()
    @IsUUID()
    agentEnroleurId?: string;

    @ApiPropertyOptional({
        description: "ID de l'agent contrôleur",
        example: 'uuid-agent-controle',
    })
    @IsOptional()
    @IsUUID()
    agentControlId?: string;

    @ApiPropertyOptional({
        description: 'ID du district',
        example: 'uuid-district',
    })
    @IsOptional()
    @IsUUID()
    districtId?: string;

    @ApiPropertyOptional({
        description: 'ID de la région',
        example: 'uuid-region',
    })
    @IsOptional()
    @IsUUID()
    regionId?: string;

    @ApiPropertyOptional({
        description: 'ID du département',
        example: 'uuid-department',
    })
    @IsOptional()
    @IsUUID()
    departmentId?: string;

    @ApiPropertyOptional({
        description: 'ID de la sous-préfecture',
        example: 'uuid-sous-prefecture',
    })
    @IsOptional()
    @IsUUID()
    sousPrefectureId?: string;

    @ApiPropertyOptional({
        description: 'ID de la localité',
        example: 'uuid-localite',
    })
    @IsOptional()
    @IsUUID()
    localiteId?: string;
}

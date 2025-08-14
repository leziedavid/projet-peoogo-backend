
import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum, IsBoolean, IsDate, IsNumber, IsUUID, ValidateNested } from 'class-validator';
import { NiveauInstruction, StatusDossier,TypeCompte} from '@prisma/client';
import { Type } from 'class-transformer';

//   startDate?: string; // ISO string
//     endDate?: string;   // ISO string
//     typeCompte?: string;

export class UsersFilterDto {
    @ApiPropertyOptional({ description: 'Filtre les utilisateurs par date de début', example: '2024-08-01T10:15:00Z' })
    @IsOptional()
    @IsDate()
    startDate?: Date;

    @ApiPropertyOptional({ description: 'Filtre les utilisateurs par date de fin', example: '2024-08-01T10:15:00Z' })
    @IsOptional()
    @IsDate()
    endDate?: Date;

    @ApiPropertyOptional({ description: 'Filtre les utilisateurs par type de compte', enum: TypeCompte, example: TypeCompte.AGRICULTEURS })
    @IsOptional()
    @IsEnum(TypeCompte)
    typeCompte?: TypeCompte;

    }
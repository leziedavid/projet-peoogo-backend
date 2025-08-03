import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class FilterUserDto {
    @ApiPropertyOptional({ example: 'ACTIVE', description: 'Statut du compte utilisateur (ACTIVE, INACTIVE)' })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiPropertyOptional({ example: 'AGENT', description: 'Rôle de l’utilisateur (ADMIN, AGENT, etc.)' })
    @IsOptional()
    @IsString()
    role?: string;

    @ApiPropertyOptional({ example: 'producteur', description: 'Type de compte utilisateur (producteur, transformateur, etc.)' })
    @IsOptional()
    @IsString()
    typeActeur?: string; // correspond à `typeCompte`

    // 🌍 Filtres géographiques (via Enrollements)
    @ApiPropertyOptional({ example: '45d62859-9eb0-4afc-9811-e7d3822cf11c', description: 'UUID du district' })
    @IsOptional()
    @IsUUID()
    districtId?: string;

    @ApiPropertyOptional({ example: '7fc44102-d782-44e6-ae5a-c8589d0911c6', description: 'UUID de la région' })
    @IsOptional()
    @IsUUID()
    regionId?: string;

    @ApiPropertyOptional({ example: 'a0014db3-a0a4-4779-8cf4-207040976285', description: 'UUID du département' })
    @IsOptional()
    @IsUUID()
    departmentId?: string;

    @ApiPropertyOptional({ example: '3c2d89a9-c460-4e88-b17d-df56d25b92e1', description: 'UUID de la sous-préfecture' })
    @IsOptional()
    @IsUUID()
    sousPrefectureId?: string;

    @ApiPropertyOptional({ example: '0af9694f-4bd4-4d74-9c44-7fc95eda85f9', description: 'UUID de la localité' })
    @IsOptional()
    @IsUUID()
    localiteId?: string;


    @ApiPropertyOptional({ example: 'tableau', description: 'Mode d\'affichage des données' })
    @IsOptional()
    @IsString()
    modeAffichage?: string;


}

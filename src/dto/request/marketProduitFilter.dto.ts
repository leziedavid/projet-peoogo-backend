import {IsString,IsUUID,IsOptional,IsNumber,IsEnum,ValidateNested,Min,Max,} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class DecoupageFilterDto {
    @ApiPropertyOptional({ example: '45d62859-9eb0-4afc-9811-e7d3822cf11c' })
    @IsOptional()
    @IsUUID()
    districtId?: string;

    @ApiPropertyOptional({ example: '7fc44102-d782-44e6-ae5a-c8589d0911c6' })
    @IsOptional()
    @IsUUID()
    regionId?: string;

    @ApiPropertyOptional({ example: 'a0014db3-a0a4-4779-8cf4-207040976285' })
    @IsOptional()
    @IsUUID()
    departmentId?: string;

    @ApiPropertyOptional({ example: '3c2d89a9-c460-4e88-b17d-df56d25b92e1' })
    @IsOptional()
    @IsUUID()
    sousPrefectureId?: string;

    @ApiPropertyOptional({ example: '0af9694f-4bd4-4d74-9c44-7fc95eda85f9' })
    @IsOptional()
    @IsUUID()
    localiteId?: string;
}

export class MarketProduitFilterDto {
    @ApiPropertyOptional({ example: 'gros', description: 'Type de vente (ex: gros, détail)' })
    @IsOptional()
    @IsString()
    typeVente?: string;

    @ApiPropertyOptional({ type: DecoupageFilterDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => DecoupageFilterDto)
    decoupage?: DecoupageFilterDto;

    @ApiPropertyOptional({ example: 'céréales' })
    @IsOptional()
    @IsString()
    categorie?: string;

    @ApiPropertyOptional({ example: 4.5 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    rating?: number;

    @ApiPropertyOptional({ example: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    prixMin?: number;

    @ApiPropertyOptional({ example: 11 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    prixMax?: number;

    @ApiPropertyOptional({ example: 100 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    qteMin?: number;

    @ApiPropertyOptional({ example: 2000 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    qteMax?: number;

    @ApiPropertyOptional({ example: '24h', description: 'Période de validité des résultats (ex: 24h, 7j, etc.)' })
    @IsOptional()
    @IsString()
    periode?: string;
}

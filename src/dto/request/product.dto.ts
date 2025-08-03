import { IsString, IsUUID, IsOptional, IsNumber, IsEnum, IsDateString, ValidateNested, IsArray, } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Express } from 'express';
import { TypeCompte } from '@prisma/client';

class DecoupageDto {
    @ApiProperty({ example: '45d62859-9eb0-4afc-9811-e7d3822cf11c' })
    @IsUUID()
    districtId: string;

    @ApiProperty({ example: '7fc44102-d782-44e6-ae5a-c8589d0911c6' })
    @IsUUID()
    regionId: string;

    @ApiProperty({ example: 'a0014db3-a0a4-4779-8cf4-207040976285' })
    @IsUUID()
    departmentId: string;

    @ApiProperty({ example: '3c2d89a9-c460-4e88-b17d-df56d25b92e1' })
    @IsUUID()
    sousPrefectureId: string;

    @ApiProperty({ example: '0af9694f-4bd4-4d74-9c44-7fc95eda85f9' })
    @IsUUID()
    localiteId: string;
}

export class ProductDto {
    @ApiProperty({ example: 'uuid' })
    @IsUUID()
    id: string;

    @ApiProperty({ example: 'Maïs jaune' })
    @IsString()
    nom: string;

    @ApiProperty({ example: 'ENROLEMENT229545270544' })
    @IsString()
    codeUsers: string;

    @ApiProperty({ example: 'Un maïs local bien sec.' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ example: 100 })
    @Type(() => Number)
    @IsNumber()
    quantite: number;

    @ApiProperty({ example: 'Kg' })
    @IsString()
    unite: string;

    @ApiProperty({ example: 250 })
    @Type(() => Number)
    @IsNumber()
    prixUnitaire: number;

    @ApiPropertyOptional({ example: 220 })
    @Type(() => Number)
    @IsOptional()
    @IsNumber()
    prixEnGros?: number;

    @ApiProperty({ example: 'ORANGE_MONEY' })
    @IsString()
    paymentMethod: string;

    @ApiProperty({ example: 'GROS' })
    @IsString()
    saleType: string;

    @ApiProperty({ enum: TypeCompte })
    @IsEnum(TypeCompte)
    typeActeur: TypeCompte;

    @ApiProperty({ example: '2025-07-01' })
    @IsDateString()
    disponibleDe: string;

    @ApiProperty({ example: '2025-07-31' })
    @IsDateString()
    disponibleJusqua: string;

    @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Image principale (upload)', })
    @IsOptional()
    image?: Express.Multer.File;

    @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Autre image (upload)',
    })
    @IsOptional()
    @IsArray()
    autreImage?: Express.Multer.File[];

    @ApiProperty({ type: DecoupageDto })
    @ValidateNested()
    @Type(() => DecoupageDto)
    decoupage: DecoupageDto;
}

export class CreateProductDto extends OmitType(ProductDto, ['id'] as const) { }

export class UpdateProductDto extends PartialType(CreateProductDto) { }

import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class RegionDto {
    @ApiProperty()
    @IsUUID()
    id: string;

    @ApiProperty()
    @IsString()
    nom: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    statut?: boolean;

    @ApiProperty()
    @IsString()
    districtId: string;
}

export class CreateRegionDto extends OmitType(RegionDto, ['id'] as const) {}
export class UpdateRegionDto extends PartialType(CreateRegionDto) {}

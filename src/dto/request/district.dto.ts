import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class DistrictDto {
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

}

export class CreateDistrictDto extends OmitType(DistrictDto, ['id'] as const) {}
export class UpdateDistrictDto extends PartialType(CreateDistrictDto) {}

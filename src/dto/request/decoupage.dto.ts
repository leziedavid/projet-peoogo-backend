import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsString, IsInt, IsUUID, IsOptional } from 'class-validator';

export class DecoupageDto {
    @ApiProperty()
    @IsUUID()
    id: string;

    // @ApiPropertyOptional({ example: 100, description: 'Nombre d’enrolés' })
    // @IsOptional()
    // @IsInt()
    // nombreEnroler?: number;

    @ApiProperty({ example: 'id du district' , description: 'id du district' })
    @IsString()
    districtId: string;

    @ApiProperty( {example: 'id de la région' , description: 'id de la région' })
    @IsString()
    regionId: string;

    @ApiProperty( {example: 'id de la département' , description: 'id de la département' })
    @IsString()
    departmentId: string;

    @ApiProperty( {example: 'id de la sous-préfecture' , description: 'id de la sous-préfecture' })
    @IsString()
    sousPrefectureId: string;

    @ApiProperty( {example: 'id de la localité' , description: 'id de la localité' })
    @IsString()
    localiteId: string;
}


export class CreateDecoupageDto extends OmitType(DecoupageDto, ['id'] as const) {}
export class UpdateDecoupageDto extends PartialType(CreateDecoupageDto) {}

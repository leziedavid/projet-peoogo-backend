import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class SousPrefectureDto {
    @ApiProperty()
    @IsUUID()
    id: string;

    @ApiProperty()
    @IsString()
    nom: string;

    @ApiProperty()
    @IsString()
    departmentId: string;
}


export class CreateSousPrefectureDto extends OmitType(SousPrefectureDto, ['id'] as const) {}
export class UpdateSousPrefectureDto extends PartialType(CreateSousPrefectureDto) {}

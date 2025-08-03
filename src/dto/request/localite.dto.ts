import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class LocaliteDto {
    @ApiProperty()
    @IsUUID()
    id: string;

    @ApiProperty()
    @IsString()
    nom: string;

    @ApiProperty()
    @IsString()
    sousPrefectureId: string;
}



export class CreateLocaliteDto extends OmitType(LocaliteDto, ['id'] as const) {}
export class UpdateLocaliteDto extends PartialType(CreateLocaliteDto) {}

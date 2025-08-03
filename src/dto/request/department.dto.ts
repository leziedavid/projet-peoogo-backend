import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class DepartmentDto {
    @ApiProperty()
    @IsUUID()
    id: string;

    @ApiProperty()
    @IsString()
    nom: string;

    @ApiProperty()
    @IsString()
    regionId: string;
}


export class CreateDepartmentDto extends OmitType(DepartmentDto, ['id'] as const) {}
export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}

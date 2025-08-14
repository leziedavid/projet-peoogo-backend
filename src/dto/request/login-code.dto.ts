// dto/request/login-code.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginWithCodeDto {
    @ApiProperty({ example: 'ENR9654#', description: 'code enrolleur' })
    @IsNotEmpty()
    @IsString()
    code: string;
}

// dto/request/login-phone.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsPhoneNumber, IsString, } from 'class-validator';

export class LoginWithPhoneDto {
    @ApiProperty({ example: '+336012345678', description: 'Numéro de téléphone' })
    @IsNotEmpty()
    @IsPhoneNumber('CI') // adapte selon ton pays
    phoneNumber: string;

    @ApiProperty({ example: 'password123', description: 'Mot de passe' })
    @IsNotEmpty()
    @IsString()
    password: string;
}

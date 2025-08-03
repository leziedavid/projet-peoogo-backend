// dto/request/login-phone.dto.ts
import { IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class LoginWithPhoneDto {
    @IsPhoneNumber('CI') // adapte selon ton pays
    phoneNumber: string;

    @IsNotEmpty()
    @IsString()
    password: string;
}

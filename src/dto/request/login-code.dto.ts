// dto/request/login-code.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginWithCodeDto {
    @IsNotEmpty()
    @IsString()
    code: string;
}

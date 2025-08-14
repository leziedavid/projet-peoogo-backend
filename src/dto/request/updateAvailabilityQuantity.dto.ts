// src/product/dto/update-availability.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsInt, Min } from 'class-validator';

export class UpdateAvailabilityDto {
    @ApiProperty({ example: '2025-08-01', description: 'Date de début de disponibilité' })
    @IsNotEmpty()
    @IsDateString()
    disponibleDe: string;

    @ApiProperty({ example: '2025-09-01', description: 'Date de fin de disponibilité' })
    @IsNotEmpty()
    @IsDateString()
    disponibleJusqua: string;
}

export class UpdateQuantityDto {
    @ApiProperty({ example: 50, description: 'Quantité disponible du produit' })
    @IsNotEmpty()
    @IsInt()
    @Min(0)
    quantite: number;
}

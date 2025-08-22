import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID } from 'class-validator';

export class ReversementDto {
    @ApiProperty({
        description: "UUID du producteur",
        example: "45d62859-9eb0-4afc-9811-e7d3822cf11c"
    })
    @IsUUID()
    producerId: string;

    @ApiProperty({ description: "Code unique généré par le producteur", example: "REV-2023-01-01-123456"})
    @IsUUID()
    codeGenerate: string;

    @ApiProperty({
        description: "UUID de la commande associée",
        example: "7fc44102-d782-44e6-ae5a-c8589d0911c6"
    })
    @IsUUID()
    orderId: string;

    @ApiProperty({
        description: "Quantité totale vendue par le producteur",
        example: 120
    })
    @IsNumber()
    totalQuantity: number;

    @ApiProperty({
        description: "Montant total des ventes du producteur",
        example: 50000
    })
    @IsNumber()
    totalAmount: number;

    @ApiProperty({
        description: "Commission de la plateforme (calculée côté back si besoin)",
        example: 9000
    })
    @IsNumber()
    platformCommission: number;

    @ApiProperty({
        description: "Revenu net du producteur (calculé côté back si besoin)",
        example: 41000
    })
    @IsNumber()
    producerEarnings: number;
}

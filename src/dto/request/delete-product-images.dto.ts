import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, IsNotEmpty, IsUrl } from 'class-validator';

export class DeleteProductImagesDto {
    @ApiProperty({
        description: 'Liste des URLs des images à supprimer',
        example: [
            'https://res.cloudinary.com/demo/image/upload/v123456789/sample1.jpg',
            'https://res.cloudinary.com/demo/image/upload/v123456789/sample2.png'
        ],
    })
    @IsArray()
    @ArrayMinSize(1)
    @IsUrl({}, { each: true })
    @IsNotEmpty({ each: true })
    fileUrls: string[];
}

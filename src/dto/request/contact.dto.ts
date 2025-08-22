import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ContactObjet } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class 
CreateContactDto {
    @ApiProperty({
        description: 'Nom et prénom de la personne',
        example: 'Jean Dupont',
    })
    @IsString()
    @MinLength(2)
    nomPrenom: string;

    @ApiProperty({
        description: 'Adresse email du contact',
        example: 'jean.dupont@example.com',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'Numéro de téléphone du contact',
        example: '+22601020304',
    })
    @IsString()
    phone: string;

    @ApiProperty({
        description: "Objet du contact (choisi parmi l'énumération ContactObjet)",
        enum: ContactObjet,
        example: ContactObjet.achat_produits,
    })
    @IsEnum(ContactObjet)
    objets: ContactObjet;

    @ApiProperty({
        description: 'Message envoyé par le contact',
        example: 'Je souhaite acheter 10 tonnes de maïs bio.',
    })
    @IsString()
    @MinLength(10)
    contents: string;

    @ApiPropertyOptional({
        description: 'Source du formulaire de contact',
        example: 'contact_form_agricole',
        default: 'contact_form_agricole',
    })
    @IsOptional()
    @IsString()
    source?: string;
}

export class UpdateContactDto {
    @ApiPropertyOptional({
        description: 'Nom et prénom de la personne',
        example: 'Jean Dupont',
    })
    @IsOptional()
    @IsString()
    nomPrenom?: string;

    @ApiPropertyOptional({
        description: 'Adresse email du contact',
        example: 'jean.dupont@example.com',
    })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({
        description: 'Numéro de téléphone du contact',
        example: '+22601020304',
    })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({
        description: 'Poste ou fonction de la personne',
        example: 'Agriculteur',
    })
    @IsOptional()
    @IsString()
    job_title?: string;

    @ApiPropertyOptional({
        description: "Nom de l'entreprise ou de l'exploitation",
        example: 'Ferme agro-bio SA',
    })
    @IsOptional()
    @IsString()
    company_name?: string;

    @ApiPropertyOptional({
        description: "Objet du contact (choisi parmi l'énumération ContactObjet)",
        enum: ContactObjet,
        example: ContactObjet.vente_produits,
    })
    @IsOptional()
    @IsEnum(ContactObjet)
    objets?: ContactObjet;

    @ApiPropertyOptional({
        description: 'Message envoyé par le contact',
        example: 'Je suis intéressé par vos services de conseil agricole.',
    })
    @IsOptional()
    @IsString()
    contents?: string;

    @ApiPropertyOptional({
        description: 'Source du formulaire de contact',
        example: 'contact_form_agricole',
    })
    @IsOptional()
    @IsString()
    source?: string;
}

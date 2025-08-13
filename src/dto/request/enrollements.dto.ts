import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum, IsBoolean, IsDate, IsNumber, IsUUID, ValidateNested } from 'class-validator';
import { NiveauInstruction, StatusDossier,TypeCompte} from '@prisma/client';
import { DecoupageDto } from './decoupage.dto';
import { Type } from 'class-transformer';

export class EnrollementsDto {
    @ApiProperty({ example: 'uuid-enrollement' })
    @IsUUID()
    id: string;

    @ApiPropertyOptional({ enum: TypeCompte, example: TypeCompte.AGRICULTEURS, description: 'Type de compte' })
    @IsOptional()
    @IsEnum(TypeCompte)
    typeCompte?: TypeCompte;

    @ApiProperty({ example: 'superviseur-id', description: "ID de l'agent superviseur" })
    @IsNotEmpty()
    @IsString()
    agent_superviseur_id: string;

    @ApiPropertyOptional({ enum: StatusDossier, example: StatusDossier.NON_TRAITE })
    @IsOptional()
    @IsEnum(StatusDossier)
    status_dossier?: StatusDossier;

    @ApiPropertyOptional({ description: 'Temps mis pour enroler (en secondes)', example: 120 })
    @IsOptional()
    @IsNumber()
    time_enrolment?: number;

    @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Photo (profil)' })
    @IsOptional()
    photo?: any;

    @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Photo document 1' })
    @IsOptional()
    photo_document_1?: any;

    @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Photo document 2' })
    @IsOptional()
    photo_document_2?: any;

    @ApiProperty()
    @IsString()
    nom: string;

    @ApiProperty()
    @IsString()
    prenom: string;

    @ApiProperty()
    @IsDate()
    datedenaissance: Date;

    @ApiProperty()
    @IsString()
    lieudenaissance: string;

    @ApiProperty()
    @IsString()
    sexe: string;

    @ApiProperty()
    @IsString()
    nationalit: string;

    @ApiProperty()
    @IsString()
    situationmatrimoniale: string;

    @ApiProperty({ enum: NiveauInstruction })
    @IsEnum(NiveauInstruction)
    niveaudinstruction: NiveauInstruction;

    @ApiProperty()
    @IsString()
    numroprincipal: string;

    @ApiProperty()
    @IsString()
    languelocaleparle: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    autreslanguelocaleparle?: string;

    @ApiPropertyOptional({ type: () => DecoupageDto, description: 'Objet découpage associé' })
    @IsOptional()
    @ValidateNested()
    @Type(() => DecoupageDto)
    decoupage?: DecoupageDto;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    campementquartier?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    coordonneesgeo?: string;

    @ApiPropertyOptional({ description: 'Activité principale ID' })
    @IsOptional()
    @IsString()
    activitprincipaleId?: string;

    @ApiPropertyOptional({ description: 'Spéculation principale ID' })
    @IsOptional()
    @IsString()
    spculationprincipaleId?: string;

    @ApiPropertyOptional({ type: [String], description: 'Autres activités (optionnel)' })
    @IsOptional()
    @IsString({ each: true })
    autresactivite?: string[];

    @ApiPropertyOptional({ type: [String], description: 'Autres spéculations (optionnel)' })
    @IsOptional()
    @IsString({ each: true })
    autresspeculation?: string[];
    
    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    superficiedevotreparcellecultu?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    indiquezlasuperficieenha?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    quantitproduction?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    prcisezlenombre?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    moyendestockage?: string;
}


export class CreateEnrollementsDto extends OmitType(EnrollementsDto, ['id'] as const) {}
export class UpdateEnrollementsDto extends PartialType(CreateEnrollementsDto) {}




// mise ajour 
// UPDATE public."Enrollements"
// SET code = 'ENR' || (TRUNC(random() * 9000) + 1000)::INT || '#'
// WHERE id = 'f97a3ebb-3200-434e-b8ca-08f65b208652';

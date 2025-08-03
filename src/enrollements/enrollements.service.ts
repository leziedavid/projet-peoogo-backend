import {Injectable,NotFoundException,InternalServerErrorException,} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/utils/cloudinary.service';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { CreateEnrollementsDto, UpdateEnrollementsDto, } from 'src/dto/request/enrollements.dto';
import { CreateDecoupageDto } from 'src/dto/request/decoupage.dto';
import { Enrollements, Prisma, PrismaClient, StatusDossier, TypeCompte } from '@prisma/client';
import { EnrollementAdminFilterDto } from 'src/dto/request/enrollementAdminFilter.dto';
import { resolveDecoupageId } from 'src/utils/decoupage.utils';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';
import { FunctionService } from 'src/utils/pagination.service';
import { ControlEnrollementDto } from 'src/dto/request/control-enrollement.dto';
import * as bcrypt from 'bcrypt';
import { FilterDto } from 'src/dto/request/filter.dto';


@Injectable()
export class EnrollementsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinary: CloudinaryService,
        private readonly functionService: FunctionService,
        
    ) { }

    /**
     * Upload un fichier buffer vers Cloudinary puis sauvegarde dans FileManager
     * @param enrollementId UUID de l’enrollement (targetId)
     * @param fileBuffer Buffer ou string (chemin)
     * @param fileType string type de fichier (ex: 'enrollements_photo')
     * @param folder string nom du dossier Cloudinary (ex: 'enrollements')
     */

    private async uploadAndSaveSingleFile(enrollementId: string, fileBuffer: Buffer | string, fileType: string, folder: string,): Promise<void> {
        // Chercher fichier existant et supprimer
        const existingFile = await this.prisma.fileManager.findFirst({
            where: { targetId: enrollementId, fileType },
            orderBy: { createdAt: 'desc' },
        });

        if (existingFile?.fileCode) {
            try {
                await this.cloudinary.deleteFileByPublicId(existingFile.fileCode);
            } catch (error) {
                console.warn(`Erreur suppression Cloudinary ${existingFile.fileCode}: ${error.message}`);
            }
            await this.prisma.fileManager.deleteMany({
                where: { targetId: enrollementId, fileType },
            });
        }

        // Upload fichier
        const uploadResult = await this.cloudinary.uploadFile(fileBuffer, folder);

        // Sauvegarde en DB
        await this.prisma.fileManager.create({
            data: {
                ...uploadResult,
                fileType,
                targetId: enrollementId,
            },
        });
    }

    // Recherche un Decoupage correspondant aux critères ou lève une erreur
    private async findDecoupageOrFail(dtoDecoupage: Partial<CreateDecoupageDto>) {
        const decoupage = await this.prisma.decoupage.findFirst({
            where: {
                districtId: dtoDecoupage.districtId,
                regionId: dtoDecoupage.regionId,
                departmentId: dtoDecoupage.departmentId,
                sousPrefectureId: dtoDecoupage.sousPrefectureId,
                localiteId: dtoDecoupage.localiteId,
            },
        });

        if (!decoupage) {
            throw new NotFoundException('Découpage non trouvé avec ces critères');
        }

        return decoupage;
    }

    private async getactiviteNameByid(id: string) {
        const activite = await this.prisma.activite.findUnique({
            where: { id },
        });

        if (!activite) {
            throw new NotFoundException('Activité non trouvée');
        }

        return activite.nom;
    }

    private async getspculationNameByid(id: string) {
        const spculation = await this.prisma.speculation.findUnique({
            where: { id },
        });

        if (!spculation) {
            throw new NotFoundException('Spéculation non trouvée');
        }

        return spculation.nom;
    }

    private parseStringOrArray<T = string>(input: unknown): T[] {
        if (Array.isArray(input)) {
            return input as T[];
        }
        if (typeof input === 'string') {
            try {
                const parsed = JSON.parse(input);
                if (Array.isArray(parsed)) {
                    return parsed as T[];
                } else {
                    console.error('Le JSON parsé n’est pas un tableau:', parsed);
                    return [];
                }
            } catch (e) {
                console.error('Erreur parsing JSON:', e instanceof Error ? e.message : e);
                return [];
            }
        }
        return [];
    }

    private parseOptionalFloat(value: any): number | null {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
    }

    private parseOptionalInt(value: any): number | null {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? null : parsed;
    }

    private parseOptionalUuid(value: any): string | null {
        return typeof value === 'string' && value.trim() !== '' ? value : null;
    }

    private generateCodes(): string {
        return `ENROLEMENT ${Math.floor(Math.random() * 1000000000000)}`; // Exemple de génération de numéro unique
    }

    async addNewAutresActivites(
        prisma: PrismaClient,
        enrollementId: string,
        userId: string,
        nouvellesActiviteIds: string[]) {
        const existantes = await prisma.autreActivite.findMany({
            where: { enrollementId },
            select: { activiteId: true },
        });

        const existantesIds = existantes.map((a) => a.activiteId);

        const activitesAajouter = nouvellesActiviteIds.filter(
            (id) => !existantesIds.includes(id)
        );

        await Promise.all(
            activitesAajouter.map((activiteId) =>
                prisma.autreActivite.create({
                    data: {
                        activiteId,
                        userId,
                        enrollementId,
                    },
                })
            )
        );
    }

    async addNewAutresSpeculations(
        prisma: PrismaClient,
        enrollementId: string,
        userId: string,
        nouvellesSpeculationIds: string[]
    ) {
        const existantes = await prisma.autreSpeculation.findMany({
            where: { enrollementId },
            select: { speculationId: true },
        });

        const existantesIds = existantes.map((s) => s.speculationId);

        const speculationsAajouter = nouvellesSpeculationIds.filter(
            (id) => !existantesIds.includes(id)
        );

        await Promise.all(
            speculationsAajouter.map((speculationId) =>
                prisma.autreSpeculation.create({
                    data: {
                        speculationId,
                        userId,
                        enrollementId,
                    },
                })
            )
        );
    }

    async create(userId: string, dto: CreateEnrollementsDto): Promise<BaseResponse<any>> {
        try {

            if (!dto.decoupage) {
                throw new NotFoundException('Découpage obligatoire pour la création');
            }

            const decoupages = await this.findDecoupageOrFail(dto.decoupage);
            const code = this.generateCodes();

            // Extraire decoupage du dto
            const { typeCompte, decoupage, photo, photo_document_1, photo_document_2,autresactivite,autresspeculation, ...dataWithoutFiles } = dto;

            const autresactiviteParsed = this.parseStringOrArray<string>(autresactivite);
            const autresspeculationParsed = this.parseStringOrArray<string>(autresspeculation);
            const now = new Date();
            // Construction data sans decoupage
            const dataToSave: any = {
                ...dataWithoutFiles,
                decoupageId: decoupages.id,
                code,
                agent_id: userId,
                TypeCompte: dto.typeCompte as TypeCompte, // ✅ mapping correct de l'enum
                status_dossier: dto.status_dossier ?? StatusDossier.NON_TRAITE,
                superficiedevotreparcellecultu: this.parseOptionalFloat(dto.superficiedevotreparcellecultu),
                indiquezlasuperficieenha: this.parseOptionalFloat(dto.indiquezlasuperficieenha),
                quantitproduction: this.parseOptionalFloat(dto.quantitproduction),
                prcisezlenombre: this.parseOptionalInt(dto.prcisezlenombre),
                agent_superviseur_id: this.parseOptionalUuid(dto.agent_superviseur_id),
                // ✅ Ajout automatique de la date actuelle pour start_date et end_date
                start_date: now,
                end_date: now,
            };

            // Nettoyage : suppression si jamais 'decoupage' traîne
            if ('decoupage' in dataToSave) delete dataToSave.decoupage;

            // Correction date si mal formattée
            if (typeof dataToSave.datedenaissance === 'string') {
                dataToSave.datedenaissance = new Date(dataToSave.datedenaissance.replace(/\"/g, ''));
            }
            console.log('dataToSave:', dataToSave); // DEBUG
            console.log('autresactiviteParsed:', autresactiviteParsed); // DEBUG
            console.log('autresspeculationParsed:', autresspeculationParsed); // DEBUG
            console.log('userId:', userId); // DEBUG

            const enrollement = await this.prisma.enrollements.create({
                data: dataToSave,
            });


            // Enregistrement des autres activités avec gestion d'erreur et log
            if (autresactiviteParsed.length > 0) {
                for (const activiteId of autresactiviteParsed) {
                    try {
                        const res = await this.prisma.autreActivite.create({
                            data: { activiteId, enrollementId: enrollement.id },
                        });
                        console.log('AutreActivite créée:', res);
                    } catch (err) {
                        console.error(`Erreur création AutreActivite pour activiteId ${activiteId}:`, err instanceof Error ? err.message : err);
                    }
                }
            }

            // Enregistrement des autres spéculations avec gestion d'erreur et log
            if (autresspeculationParsed.length > 0) {
                for (const speculationId of autresspeculationParsed) {
                    try {
                        const res = await this.prisma.autreSpeculation.create({
                            data: { speculationId, enrollementId: enrollement.id },
                        });
                        console.log('AutreSpeculation créée:', res);
                    } catch (err) {
                        console.error(`Erreur création AutreSpeculation pour speculationId ${speculationId}:`, err instanceof Error ? err.message : err);
                    }
                }
            }

            // Upload des fichiers un par un
            if (photo) {
                await this.uploadAndSaveSingleFile(enrollement.id, photo, 'enrollements_photo', 'enrollements');
            }

            if (photo_document_1) {
                await this.uploadAndSaveSingleFile(enrollement.id, photo_document_1, 'enrollements_photo_document_1', 'enrollements');
            }

            if (photo_document_2) {
                await this.uploadAndSaveSingleFile(enrollement.id, photo_document_2, 'enrollements_photo_document_2', 'enrollements');
            }

            return new BaseResponse(201, 'Enrollement créé', 'enrollement');
        } catch (error) {
            throw new InternalServerErrorException(`Erreur création enrollement: ${error.message}`);
        }
    }

    async update(id: string, dto: UpdateEnrollementsDto): Promise<BaseResponse<any>> {

        const enrollement = await this.prisma.enrollements.findUnique({ where: { id } });
        if (!enrollement) throw new NotFoundException('Enrollement introuvable');

        try {

            const { decoupage, photo, photo_document_1, photo_document_2, ..._rest } = dto;

            // Construction manuelle et sécurisée des données à mettre à jour
            const dataToUpdate: Prisma.EnrollementsUncheckedUpdateInput = {
                agent_superviseur_id: dto.agent_superviseur_id,
                status_dossier: dto.status_dossier,
                time_enrolment: dto.time_enrolment,
                nom: dto.nom,
                prenom: dto.prenom,
                datedenaissance: dto.datedenaissance,
                lieudenaissance: dto.lieudenaissance,
                sexe: dto.sexe,
                nationalit: dto.nationalit,
                situationmatrimoniale: dto.situationmatrimoniale,
                niveaudinstruction: dto.niveaudinstruction,
                numroprincipal: dto.numroprincipal,
                languelocaleparle: dto.languelocaleparle,
                autreslanguelocaleparle: dto.autreslanguelocaleparle,
                campementquartier: dto.campementquartier,
                coordonneesgeo: dto.coordonneesgeo,
                activitprincipaleId: dto.activitprincipaleId,
                spculationprincipaleId: dto.spculationprincipaleId,
                superficiedevotreparcellecultu: dto.superficiedevotreparcellecultu,
                indiquezlasuperficieenha: dto.indiquezlasuperficieenha,
                quantitproduction: dto.quantitproduction,
                prcisezlenombre: dto.prcisezlenombre,
                moyendestockage: dto.moyendestockage,
            };

            // Mise à jour éventuelle de type de compte
            if (dto.typeCompte) {
                dataToUpdate.TypeCompte = dto.typeCompte;
            }

            // Mise à jour éventuelle du découpage
            if (decoupage?.id) {
                dataToUpdate.decoupageId = decoupage.id;
            }

            const updated = await this.prisma.enrollements.update({
                where: { id },
                data: dataToUpdate,
            });

            // Parsing sécurisé avant traitement des autres activités et spéculations
            const autresactiviteParsed = this.parseStringOrArray<string>(dto.autresactivite);
            const autresspeculationParsed = this.parseStringOrArray<string>(dto.autresspeculation);

            if (autresactiviteParsed.length > 0) {
                await this.addNewAutresActivites(
                    this.prisma,
                    enrollement.id,
                    enrollement.agent_id,
                    autresactiviteParsed
                );
            }

            if (autresspeculationParsed.length > 0) {
                await this.addNewAutresSpeculations(
                    this.prisma,
                    enrollement.id,
                    enrollement.agent_id,
                    autresspeculationParsed
                );
            }

            // Upload fichiers un par un s'ils sont présents
            if (photo) {
                await this.uploadAndSaveSingleFile(id, photo, 'enrollements_photo', 'enrollements');
            }
            if (photo_document_1) {
                await this.uploadAndSaveSingleFile(id, photo_document_1, 'enrollements_photo_document_1', 'enrollements');
            }
            if (photo_document_2) {
                await this.uploadAndSaveSingleFile(id, photo_document_2, 'enrollements_photo_document_2', 'enrollements');
            }

            return new BaseResponse(200, 'Enrollement mis à jour', updated);
        } catch (error) {
            throw new InternalServerErrorException(`Erreur mise à jour enrollement: ${error.message}`);
        }
    }

    async findOne(id: string): Promise<BaseResponse<any>> {
        const enrollement = await this.prisma.enrollements.findUnique({
            where: { id },
        });
        if (!enrollement) throw new NotFoundException('Enrollement introuvable');

        const files = await this.prisma.fileManager.findMany({
            where: { targetId: id, fileType: { startsWith: 'enrollements' } },
        });

        return new BaseResponse(200, 'Enrollement trouvé', {
            ...enrollement,
            files,
        });
    }

    async softDelete(id: string): Promise<BaseResponse<any>> {
        const enrollement = await this.prisma.enrollements.findUnique({ where: { id } });
        if (!enrollement) throw new NotFoundException('Enrollement introuvable');

        await this.prisma.enrollements.update({
            where: { id },
            data: { is_deleted: true },
        });

        return new BaseResponse(200, 'Enrollement supprimé (logique)', null);
    }

    async hardDelete(id: string): Promise<BaseResponse<any>> {
        const enrollement = await this.prisma.enrollements.findUnique({ where: { id } });
        if (!enrollement) throw new NotFoundException('Enrollement introuvable');

        const files = await this.prisma.fileManager.findMany({ where: { targetId: id } });

        for (const file of files) {
            try {
                await this.cloudinary.deleteFileByPublicId(file.fileCode);
            } catch (error) {
                console.warn(`Erreur suppression Cloudinary fichier ${file.fileCode}: ${error.message}`);
            }
        }

        await this.prisma.fileManager.deleteMany({ where: { targetId: id } });
        await this.prisma.enrollements.delete({ where: { id } });

        return new BaseResponse(200, 'Enrollement supprimé définitivement', null);
    }

    async findAll(): Promise<BaseResponse<any>> {
        try {
            const enrollements = await this.prisma.enrollements.findMany({
                where: {
                    is_deleted: false,
                },
                include: {
                    agent_enroleur: true,
                    agent_superviseur: true,
                    user_control: true,
                    decoupage: true,
                    activitprincipale: true,
                    spculationprincipale: true,
                },
            });

            return new BaseResponse(200, 'Liste des enrollements', enrollements);
        } catch (error) {
            return new BaseResponse(500, 'Erreur lors de la récupération des enrollements', []);
        }
    }

    async getAllPaginate(params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page, limit } = params;

        const data = await this.functionService.paginate({
            model: 'Enrollements',
            page: Number(page),
            limit: Number(limit),
            conditions: { is_deleted: false },
            selectAndInclude: {
                select: null,
                include: {
                    agent_enroleur: true,
                    agent_superviseur: true,
                    user_control: true,
                    decoupage: {
                        include: {
                            district: true,
                            region: true,
                            department: true,
                            sousPrefecture: true,
                            localite: true,
                        },
                    },
                    activitprincipale: true,
                    spculationprincipale: true,
                    autresActivites: {    // inclusion relation pivot + detail
                        include: {
                            activite: true,   // récupère le détail complet de l’activité liée
                        }
                    },
                    autresSpeculations: {  // idem pour spéculation
                        include: {
                            speculation: true, // récupère le détail complet de la spéculation liée
                        }
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const enrichedEnrollements = await Promise.all(
            data.data.map(async (enrollement) => {
                const [photo, document1, document2] = await Promise.all([
                    this.prisma.fileManager.findFirst({
                        where: { targetId: enrollement.id, fileType: 'enrollements_photo' },
                        orderBy: { createdAt: 'desc' },
                    }),
                    this.prisma.fileManager.findFirst({
                        where: { targetId: enrollement.id, fileType: 'enrollements_photo_document_1' },
                        orderBy: { createdAt: 'desc' },
                    }),
                    this.prisma.fileManager.findFirst({
                        where: { targetId: enrollement.id, fileType: 'enrollements_photo_document_2' },
                        orderBy: { createdAt: 'desc' },
                    }),
                ]);

                return {
                    ...enrollement,
                    photo: photo?.fileUrl || null,
                    document1: document1?.fileUrl || null,
                    document2: document2?.fileUrl || null,
                };
            })
        );

        return new BaseResponse(200, 'Liste paginée des enrôlements', {
            ...data,
            data: enrichedEnrollements,
        });
    }

    // get by agent conttrole
    async getStatistiquesControle(userId: string): Promise<BaseResponse<any>> {
        // Tableau des statuts à compter
        const statuses = [
            StatusDossier.VAL,
            StatusDossier.NON_TRAITE,
            StatusDossier.REJ,
            StatusDossier.DOUBLON,
            StatusDossier.ENCOURS,
            StatusDossier.DEL,
            StatusDossier.IMAGE_INCOR,
            StatusDossier.DOUBLON_NUMBER,
        ];

        // Exécuter un count par statut en parallèle
        const counts = await Promise.all(
            statuses.map((status) =>
                this.prisma.enrollements.count({
                    where: {
                        is_deleted: false,
                        user_control_id: userId,
                        status_dossier: status,
                    },
                })
            )
        );

        // Construire un objet avec chaque statut et son total
        const statsByStatus = statuses.reduce((acc, status, idx) => {
            acc[status.toLowerCase()] = counts[idx];
            return acc;
        }, {} as Record<string, number>);

        const nbTotalDossiers = counts.reduce((a, b) => a + b, 0);

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
            },
        });

        const agentInfo = user
            ? {
                user_control_id: user.id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                nb_dossiers_tires: nbTotalDossiers,
            }
            : {
                user_control_id: userId,
                name: 'Utilisateur inconnu',
                email: null,
                phoneNumber: null,
                nb_dossiers_tires: nbTotalDossiers,
            };

        return new BaseResponse(200, 'Statistiques complètes des dossiers de contrôle', {
            ...statsByStatus,
            agent: agentInfo,
        });
    }

    async getStatsAdmin(filters: EnrollementAdminFilterDto): Promise<BaseResponse<any>> {
        const hasFilters =
            filters &&
            Object.values(filters).some((value) => value !== undefined && value !== null && value !== '');

        let whereClause: any = { is_deleted: false };

        if (hasFilters) {
            const { startDate, endDate, agentEnroleurId, agentControlId, ...decoupageFilter } = filters;
            const decoupageId = await resolveDecoupageId(decoupageFilter, this.prisma);

            whereClause = {
                ...whereClause,
                ...(startDate && endDate && {
                    createdAt: { gte: startDate, lte: endDate },
                }),
                ...(agentEnroleurId && { agent_id: agentEnroleurId }),
                ...(agentControlId && { user_control_id: agentControlId }),
                ...(decoupageId && { decoupageId }),
            };
        }

        const statuses = [
            StatusDossier.VAL,
            StatusDossier.NON_TRAITE,
            StatusDossier.REJ,
            StatusDossier.DOUBLON,
            StatusDossier.ENCOURS,
            StatusDossier.DEL,
            StatusDossier.IMAGE_INCOR,
            StatusDossier.DOUBLON_NUMBER,
        ];

        const counts = await Promise.all(
            statuses.map((status) =>
                this.prisma.enrollements.count({
                    where: { ...whereClause, status_dossier: status },
                })
            )
        );

        const statsByStatus = statuses.reduce((acc, status, idx) => {
            acc[status.toLowerCase()] = counts[idx];
            return acc;
        }, {} as Record<string, number>);

        return new BaseResponse(200, 'Statistiques des enrôlements (admin)', statsByStatus);
    }

    async controlEnrollement( enrollementId: string, userControlId: string, dto: ControlEnrollementDto): Promise<BaseResponse<any>> {
        
        const enrollement = await this.prisma.enrollements.findUnique({  where: { id: enrollementId }, });

        if (!enrollement) {
            throw new NotFoundException('Enrôlement introuvable');
        }

        const { status_dossier, commentaire, numeroLot } = dto;

        const now = new Date();
        const isValid = status_dossier === StatusDossier.VAL;

        const dataToUpdate: Prisma.EnrollementsUncheckedUpdateInput = {
            user_control_id: userControlId,
            confirm_validation_control: isValid,
            numero_lot: numeroLot ?? null,
            validation_control: isValid,
            date_validation_control: now,
            date_confirm_validation_control: isValid ? now : null,
            commentaire_controle: commentaire ?? null,
            status_dossier,
        };

        const updated = await this.prisma.enrollements.update({
            where: { id: enrollementId },
            data: dataToUpdate,
        });

        // ✅ Créer l'utilisateur si dossier validé
        if (isValid) {
            await this.createUserFromEnrollement(enrollement);
        }
        console.log('updated:', enrollement.code + '@app.local');

        return new BaseResponse( 200, `Dossier mis à jour avec le statut ${status_dossier}`, updated );
    }


    private async createUserFromEnrollement(enrollement: Enrollements) {
        const existingUser = await this.prisma.user.findFirst({
            where: { codeGenerate: enrollement.code },
        });

        if (existingUser) return;

        const rawPassword = enrollement.code;
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        await this.prisma.user.create({
            data: {
                email: `${enrollement.code}@app.local`,
                password: hashedPassword,
                codeGenerate: enrollement.code,
                passwordGenerate: rawPassword,
                enrollementsId: enrollement.id,
                name: `${enrollement.nom} ${enrollement.prenom}`,
                role: 'USER',
                status: 'ACTIVE',
                phoneNumber: enrollement.numroprincipal,
                typeCompte: enrollement.TypeCompte, // ✅ Ajout ici
            },
        });
    }


    // filtres generale

    async enrollementFilter(filters: FilterDto, params: PaginationParamsDto): Promise<BaseResponse<any>> {
        
        const { page, limit } = params;
        const { modeAffichage } = filters;
        // console.log('filters:', filters);

        const where: any = {
            is_deleted: false,
        };

        // Filtres dynamiques
        if (filters.districtId) where.decoupage = { districtId: filters.districtId };
        if (filters.regionId) where.decoupage = { ...where.decoupage, regionId: filters.regionId };
        if (filters.departmentId) where.decoupage = { ...where.decoupage, departmentId: filters.departmentId };
        if (filters.sousPrefectureId) where.decoupage = { ...where.decoupage, sousPrefectureId: filters.sousPrefectureId };
        if (filters.localiteId) where.decoupage = { ...where.decoupage, localiteId: filters.localiteId };
        if (filters.activitprincipaleId) where.activitprincipaleId = filters.activitprincipaleId;
        if (filters.spculationprincipaleId) where.spculationprincipaleId = filters.spculationprincipaleId;
        // if (filters.periode) where.start_date = { $gte: filters.periode[0], $lte: filters.periode[1] };
        if (filters.statutDossier) where.status_dossier = filters.statutDossier;
        if (filters.typeActeur) where.TypeCompte = filters.typeActeur;
        if (filters.heureDebutEnrolement) where.time_enrolment = { $gte: filters.heureDebutEnrolement, $lte: filters.heureFinEnrolement };



        // Cas modeAffichage = tableau
        if (modeAffichage === 'tableau') {
            const data = await this.functionService.paginate({
                model: 'Enrollements',
                page: Number(page),
                limit: Number(limit),
                conditions: where,
                selectAndInclude: {
                    select: null,
                    include: {
                        agent_enroleur: true,
                        agent_superviseur: true,
                        user_control: true,
                        decoupage: {
                            include: {
                                district: true,
                                region: true,
                                department: true,
                                sousPrefecture: true,
                                localite: true,
                            },
                        },
                        activitprincipale: true,
                        spculationprincipale: true,
                        autresActivites: {
                            include: { activite: true }
                        },
                        autresSpeculations: {
                            include: { speculation: true }
                        }
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            return new BaseResponse(200, 'Résultat filtré (tableau)', data);
        }

        // Cas modeAffichage = carte
        if (modeAffichage === 'carte') {
            const result = await this.prisma.enrollements.findMany({
                where,
                select: {
                    coordonneesgeo: true,
                },
            });

            const coords = result
                .filter(r => r.coordonneesgeo && r.coordonneesgeo.includes(','))
                .map(r => {
                    const [lat, lng] = r.coordonneesgeo.split(',').map(Number);
                    return { lat, lng };
                });

            return new BaseResponse(200, 'Résultat filtré (carte)', coords);
        }

        // Cas modeAffichage = graphique (nombre par jour)
        if (modeAffichage === 'graphique') {
            const data = await this.prisma.enrollements.groupBy({
                by: ['createdAt'],
                where,
                _count: {
                    _all: true,
                },
                orderBy: {
                    createdAt: 'asc',
                },
            });

            const formatted = data.map(item => ({
                date: item.createdAt.toISOString().split('T')[0],
                total: item._count._all,
            }));

            return new BaseResponse(200, 'Résultat filtré (graphique)', formatted);
        }

        throw new NotFoundException('Mode d\'affichage non reconnu');
    }



}

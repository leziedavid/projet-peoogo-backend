import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { parse } from 'csv-parse';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { BaseResponse } from 'src/dto/request/base-response.dto';

@Injectable()
export class ImportDecoupageService {
    constructor(private readonly prisma: PrismaService) { }

    async importFromExcelOrCsv(fileBuffer: Buffer, fileType: 'csv' | 'xlsx'): Promise<{ success: boolean; message: string }> {
        try {
            const records = fileType === 'csv' ? await this.parseCSV(fileBuffer) : this.parseExcel(fileBuffer);

            for (const row of records) {
                const districtName = row.District?.trim();
                const regionName = row.Region?.trim();
                const departmentName = row.Department?.trim();
                const sousPrefectureName = row.SousPrefecture?.trim();
                const localiteName = row.Localite?.trim();

                if (!(districtName && regionName && departmentName && sousPrefectureName && localiteName)) continue;

                const district = await this.findOrCreate('district', { nom: districtName });
                const region = await this.findOrCreate('region', { nom: regionName, districtId: district.id });
                const department = await this.findOrCreate('department', { nom: departmentName, regionId: region.id });
                const sousPref = await this.findOrCreate('sousPrefecture', { nom: sousPrefectureName, departmentId: department.id });
                const localite = await this.findOrCreate('localite', { nom: localiteName, sousPrefectureId: sousPref.id });

                // Vérifie s’il existe déjà un découpage avec ces 5 IDs
                const exists = await this.prisma.decoupage.findFirst({
                    where: {
                        districtId: district.id,
                        regionId: region.id,
                        departmentId: department.id,
                        sousPrefectureId: sousPref.id,
                        localiteId: localite.id,
                    },
                });

                if (!exists) {
                    await this.prisma.decoupage.create({
                        data: {
                            id: uuidv4(),
                            districtId: district.id,
                            regionId: region.id,
                            departmentId: department.id,
                            sousPrefectureId: sousPref.id,
                            localiteId: localite.id,
                            nombreEnroler: 0,
                        },
                    });
                }
            }

            return { success: true, message: 'Importation terminée avec succès' };
        } catch (err) {
            console.error(err);
            throw new InternalServerErrorException('Erreur pendant l\'importation');
        }
    }

    private async findOrCreate(
        entity: 'district' | 'region' | 'department' | 'sousPrefecture' | 'localite',
        data: any,
    ) {
        switch (entity) {
            case 'district': {
                const existing = await this.prisma.district.findFirst({ where: { nom: data.nom } });
                if (existing) return existing;
                return await this.prisma.district.create({ data: { id: uuidv4(), ...data } });
            }
            case 'region': {
                const existing = await this.prisma.region.findFirst({ where: { nom: data.nom } });
                if (existing) return existing;
                return await this.prisma.region.create({ data: { id: uuidv4(), ...data } });
            }
            case 'department': {
                const existing = await this.prisma.department.findFirst({ where: { nom: data.nom } });
                if (existing) return existing;
                return await this.prisma.department.create({ data: { id: uuidv4(), ...data } });
            }
            case 'sousPrefecture': {
                const existing = await this.prisma.sousPrefecture.findFirst({ where: { nom: data.nom } });
                if (existing) return existing;
                return await this.prisma.sousPrefecture.create({ data: { id: uuidv4(), ...data } });
            }
            case 'localite': {
                const existing = await this.prisma.localite.findFirst({ where: { nom: data.nom } });
                if (existing) return existing;
                return await this.prisma.localite.create({ data: { id: uuidv4(), ...data } });
            }
            default:
                throw new Error(`Unknown entity: ${entity}`);
        }
    }

    private async parseCSV(buffer: Buffer): Promise<any[]> {
        return new Promise((resolve, reject) => {
            parse(buffer, {
                columns: true,
                skip_empty_lines: true,
            }, (err, output) => {
                if (err) reject(err);
                else resolve(output);
            });
        });
    }

    private parseExcel(buffer: Buffer): any[] {
        const workbook = xlsx.read(buffer);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        return xlsx.utils.sheet_to_json(worksheet);
    }

    // Ajoutez ces méthodes à votre classe ImportDecoupageService
    /**
     * Récupère tous les districts
     * GET /api/districts
     */
    async getAllDistricts() {
        try {
            const districts = await this.prisma.district.findMany({
                select: {
                    id: true,
                    nom: true,
                    statut: true,
                },
                orderBy: {
                    nom: 'asc'
                }
            });

            return new BaseResponse(200, 'Liste des districts récupérée avec succès ', districts);

        } catch (error) {
            console.error('Erreur lors de la récupération des districts:', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des districts');
        }
    }

    /**
     * Récupère toutes les régions d'un district
     * GET /api/regions?districtId=${id}
     */
    async getRegionsByDistrict(districtId: string) {
        try {
            // Vérifier si le district existe
            const district = await this.prisma.district.findUnique({
                where: { id: districtId }
            });

            if (!district) {
                throw new Error('District non trouvé');
            }

            const regions = await this.prisma.region.findMany({
                where: {
                    districtId: districtId
                },
                select: {
                    id: true,
                    nom: true,
                    statut: true,
                    districtId: true,
                },
                orderBy: {
                    nom: 'asc'
                }
            });
            return new BaseResponse(200, 'Liste des regions récupérée avec succès ', regions);
        } catch (error) {
            console.error('Erreur lors de la récupération des régions:', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des régions');
        }
    }

    /**
     * Récupère tous les départements d'une région
     * GET /api/departments?regionId=${id}
     */
    async getDepartmentsByRegion(regionId: string) {
        try {
            // Vérifier si la région existe
            const region = await this.prisma.region.findUnique({
                where: { id: regionId }
            });

            if (!region) {
                throw new Error('Région non trouvée');
            }

            const departments = await this.prisma.department.findMany({
                where: {
                    regionId: regionId
                },
                select: {
                    id: true,
                    nom: true,
                    regionId: true,
                },
                orderBy: {
                    nom: 'asc'
                }
            });

            return new BaseResponse(200, 'Liste des départments récupérée avec succès ', departments);
        } catch (error) {
            console.error('Erreur lors de la récupération des départements:', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des départements');
        }
    }

    /**
     * Récupère toutes les sous-préfectures d'un département
     * GET /api/sous-prefectures?departmentId=${id}
     */
    async getSousPrefecturesByDepartment(departmentId: string) {
        try {
            // Vérifier si le département existe
            const department = await this.prisma.department.findUnique({
                where: { id: departmentId }
            });

            if (!department) {
                throw new Error('Département non trouvé');
            }

            const sousPrefectures = await this.prisma.sousPrefecture.findMany({
                where: {
                    departmentId: departmentId
                },
                select: {
                    id: true,
                    nom: true,
                    departmentId: true,
                },
                orderBy: {
                    nom: 'asc'
                }
            });
            return new BaseResponse(200, 'Liste des sous prefectures récupérée avec succès ', sousPrefectures);

        } catch (error) {
            console.error('Erreur lors de la récupération des sous-préfectures:', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des sous-préfectures');
        }
    }

    /**
     * Récupère toutes les localités d'une sous-préfecture
     * GET /api/localites?sousPrefectureId=${id}
     */
    async getLocalitesBySousPrefecture(sousPrefectureId: string) {
        try {
            // Vérifier si la sous-préfecture existe
            const sousPrefecture = await this.prisma.sousPrefecture.findUnique({
                where: { id: sousPrefectureId }
            });

            if (!sousPrefecture) {
                throw new Error('Sous-préfecture non trouvée');
            }

            const localites = await this.prisma.localite.findMany({
                where: {
                    sousPrefectureId: sousPrefectureId
                },
                select: {
                    id: true,
                    nom: true,
                    sousPrefectureId: true,
                },
                orderBy: {
                    nom: 'asc'
                }
            });
            return new BaseResponse(200, 'Liste des sous localités récupérée avec succès ', localites);

        } catch (error) {
            console.error('Erreur lors de la récupération des localités:', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des localités');
        }
    }


}

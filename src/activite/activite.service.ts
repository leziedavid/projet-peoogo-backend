import {Injectable,NotFoundException,BadRequestException,InternalServerErrorException,} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { CreateActiviteDto, UpdateActiviteDto } from 'src/dto/request/activite.dto';

import { parse } from 'csv-parse/sync';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';


@Injectable()
export class ActiviteService {

    constructor(private readonly prisma: PrismaService) { }

    private parseCSV(buffer: Buffer): any[] {
        const csvString = buffer.toString('utf-8');
        return parse(csvString, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });
    }

    private parseExcel(buffer: Buffer): any[] {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        return XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    }

    async importFromExcelOrCsv(fileBuffer: Buffer, fileType: 'csv' | 'xlsx'): Promise<{ success: boolean; message: string }> {
        try {
            const records = fileType === 'csv' ? this.parseCSV(fileBuffer) : this.parseExcel(fileBuffer);

            for (const row of records) {
                const nom = (row.activite ?? '').trim();
                if (!nom) continue;

                const exists = await this.prisma.activite.findFirst({
                    where: { nom },
                });

                if (!exists) {
                    await this.prisma.activite.create({
                        data: {
                            nom,
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


    async create(dto: CreateActiviteDto): Promise<BaseResponse<any>> {
        try {
            console.log('DTO reçu:', dto);
            if (!dto.nom || !Array.isArray(dto.nom) || dto.nom.length === 0) {
                throw new BadRequestException('Liste des noms vide ou invalide');
            }

            const data = dto.nom.map((nom) => ({ nom: nom.trim() })).filter(a => a.nom.length > 0);

            if (data.length === 0) {
                throw new BadRequestException('Aucun nom valide fourni');
            }

            const activites = await this.prisma.activite.createMany({
                data,
                skipDuplicates: true,
            });

            return new BaseResponse(201, `${activites.count} activités créées avec succès`, { count: activites.count });
        } catch (error) {
            console.error('Erreur createMany:', error);
            throw new InternalServerErrorException('Erreur lors de la création des activités.');
        }
    }


    async update(id: string, dto: UpdateActiviteDto): Promise<BaseResponse<any>> {
        try {
            // Vérification existence
            const existing = await this.prisma.activite.findUnique({ where: { id } });
            if (!existing) {
                throw new NotFoundException('Activité non trouvée');
            }

            const updated = await this.prisma.activite.update({
                where: { id },
                data: { nom: dto.nom },
            });

            return new BaseResponse(200, 'Activité mise à jour avec succès', updated);
        } catch (error) {
            throw new InternalServerErrorException('Erreur lors de la mise à jour');
        }
    }


    async findAll(): Promise<BaseResponse<any>> {
        const activites = await this.prisma.activite.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return new BaseResponse(200, 'Liste des activités', activites);
    }

    async findOne(id: string): Promise<BaseResponse<any>> {
        const activite = await this.prisma.activite.findUnique({ where: { id } });
        if (!activite) {
            throw new NotFoundException('Activité non trouvée');
        }
        return new BaseResponse(200, 'Activité récupérée', activite);
    }


    async remove(id: string): Promise<BaseResponse<any>> {
        try {
            await this.prisma.activite.delete({ where: { id } });
            return new BaseResponse(200, 'Activité supprimée avec succès', null);
        } catch (error) {
            if (error.code === 'P2025') {
                throw new NotFoundException('Activité non trouvée');
            }
            throw new InternalServerErrorException('Erreur lors de la suppression');
        }
    }
}



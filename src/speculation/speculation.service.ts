import {Injectable,NotFoundException,BadRequestException,InternalServerErrorException,} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { CreateSpeculationDto, UpdateSpeculationDto } from 'src/dto/request/speculation.dto';

import { parse } from 'csv-parse/sync';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';

@Injectable()
export class SpeculationService {
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
                const nom = (row.speculation ?? '').trim();
                if (!nom) continue;

                const exists = await this.prisma.speculation.findFirst({
                    where: { nom },
                });

                if (!exists) {
                    await this.prisma.speculation.create({
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



    async create(dto: CreateSpeculationDto): Promise<BaseResponse<any>> {
        try {
            console.log('DTO reçu:', dto);
            if (!dto.nom || !Array.isArray(dto.nom) || dto.nom.length === 0) {
                throw new BadRequestException('Liste des noms vide ou invalide');
            }

            const data = dto.nom.map((nom) => ({ nom: nom.trim() })).filter(a => a.nom.length > 0);

            if (data.length === 0) {
                throw new BadRequestException('Aucun nom valide fourni');
            }

            const speculations = await this.prisma.speculation.createMany({
                data,
                skipDuplicates: true,
            });

            return new BaseResponse(201, `${speculations.count} speculations créées avec succès`, { count: speculations.count });
        } catch (error) {
            console.error('Erreur createMany:', error);
            throw new InternalServerErrorException('Erreur lors de la création des speculations.');
        }
    }


    async findAll(): Promise<BaseResponse<any>> {
        const speculations = await this.prisma.speculation.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return new BaseResponse(200, 'Liste des spéculations', speculations);
    }

    async findOne(id: string): Promise<BaseResponse<any>> {
        const speculation = await this.prisma.speculation.findUnique({ where: { id } });
        if (!speculation) {
            throw new NotFoundException('Spéculation non trouvée');
        }
        return new BaseResponse(200, 'Spéculation récupérée', speculation);
    }

    async update(id: string, dto: UpdateSpeculationDto): Promise<BaseResponse<any>> {
        try {
            const speculation = await this.prisma.speculation.update({
                where: { id },
                data: dto,
            });
            return new BaseResponse(200, 'Spéculation mise à jour avec succès', speculation);
        } catch (error) {
            if (error.code === 'P2025') {
                throw new NotFoundException('Spéculation non trouvée');
            }
            throw new InternalServerErrorException('Erreur lors de la mise à jour');
        }
    }

    async remove(id: string): Promise<BaseResponse<any>> {
        try {
            await this.prisma.speculation.delete({ where: { id } });
            return new BaseResponse(200, 'Spéculation supprimée avec succès', null);
        } catch (error) {
            if (error.code === 'P2025') {
                throw new NotFoundException('Spéculation non trouvée');
            }
            throw new InternalServerErrorException('Erreur lors de la suppression');
        }
    }
}



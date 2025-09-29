import {Injectable,NotFoundException,BadRequestException,InternalServerErrorException,} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { CreateCategorieDto, UpdateCategorieDto } from 'src/dto/request/categorie.dto';
import { Status } from '@prisma/client';

@Injectable()
export class CategorieService {
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

    async importFromExcelOrCsv(fileBuffer: Buffer, fileType: 'csv' | 'xlsx',): Promise<{ success: boolean; message: string }> {
        try {
            const records =
                fileType === 'csv' ? this.parseCSV(fileBuffer) : this.parseExcel(fileBuffer);

            for (const row of records) {

                const nom = (row.categorie ?? '').trim();
                if (!nom) continue;

                const exists = await this.prisma.categorie.findFirst({
                    where: { nom },
                });

                if (!exists) {
                    await this.prisma.categorie.create({
                        data: {
                            nom,
                            status: 'ACTIVE',
                        },
                    });
                }
                
            }

            return { success: true, message: 'Importation des catégories terminée avec succès' };
        } catch (err) {
            console.error(err);
            throw new InternalServerErrorException('Erreur pendant l\'importation');
        }
    }

    async create(dto: CreateCategorieDto): Promise<BaseResponse<any>> {
        try {
            if (!dto.nom || !Array.isArray(dto.nom) || dto.nom.length === 0) {
                throw new BadRequestException('Liste des noms vide ou invalide');
            }

            const data = dto.nom
                .map((nom) => ({
                    nom: nom.trim(),
                    status: dto.status ? (dto.status as Status) : Status.ACTIVE, // ⚡ Cast explicite
                }))
                .filter((c) => c.nom.length > 0);

            if (data.length === 0) {
                throw new BadRequestException('Aucun nom valide fourni');
            }

            const categories = await this.prisma.categorie.createMany({
                data,
                skipDuplicates: true,
            });

            return new BaseResponse(201, `${categories.count} catégories créées avec succès`, {
                count: categories.count,
            });
        } catch (error) {
            console.error('Erreur createMany Categorie:', error);
            throw new InternalServerErrorException('Erreur lors de la création des catégories.');
        }
    }

    async update(id: string, dto: UpdateCategorieDto): Promise<BaseResponse<any>> {
        const existing = await this.prisma.categorie.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('Catégorie non trouvée');
        }

        const updated = await this.prisma.categorie.update({
            where: { id },
            data: {
                nom: dto.nom,
                status: dto.status ? (dto.status as Status) : undefined, // ⚡ Cast
            },
        });

        return new BaseResponse(200, 'Catégorie mise à jour avec succès', updated);
    }

    async findAll(): Promise<BaseResponse<any>> {
        const categories = await this.prisma.categorie.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return new BaseResponse(200, 'Liste des catégories', categories);
    }

    async findOne(id: string): Promise<BaseResponse<any>> {
        const categorie = await this.prisma.categorie.findUnique({ where: { id } });
        if (!categorie) {
            throw new NotFoundException('Catégorie non trouvée');
        }
        return new BaseResponse(200, 'Catégorie récupérée', categorie);
    }

    async remove(id: string): Promise<BaseResponse<any>> {
        try {
            await this.prisma.categorie.delete({ where: { id } });
            return new BaseResponse(200, 'Catégorie supprimée avec succès', null);
        } catch (error) {
            if (error.code === 'P2025') {
                throw new NotFoundException('Catégorie non trouvée');
            }
            throw new InternalServerErrorException('Erreur lors de la suppression');
        }
    }
}

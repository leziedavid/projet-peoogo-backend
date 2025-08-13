import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { UpdateRegionDto } from 'src/dto/request/region.dto';
import { FunctionService, PaginateOptions } from 'src/utils/pagination.service';

// Imports identiques
@Injectable()
export class RegionService {
    constructor(private readonly prisma: PrismaService,
    private readonly functionService: FunctionService,

    ) { }

    
    async getAllparginate(page: number, limit: number): Promise<BaseResponse<any>> {
        try {
            const paginateOptions: PaginateOptions = {
                model: 'Region',
                page: Number(page),
                limit: Number(limit),
                selectAndInclude: {
                    select: null,
                    include: {
                        district: true,
                    },
                },
                orderBy: { nom: 'asc' },
            };

            const data = await this.functionService.paginate(paginateOptions);

            return new BaseResponse(200, 'Liste paginée des régions', data);
        } catch (error) {
            console.error('Erreur lors de la récupération des régions :', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des régions');
        }
    }

    async findAll(): Promise<BaseResponse<any>> {
        const data = await this.prisma.region.findMany({ orderBy: { nom: 'asc' }, include: { district: true } });
        return new BaseResponse(200, 'Liste des régions', data);
    }

    async findOne(id: string): Promise<BaseResponse<any>> {
        const item = await this.prisma.region.findUnique({ where: { id }, include: { district: true } });
        if (!item) throw new NotFoundException('Région non trouvée');
        return new BaseResponse(200, 'Région trouvée', item);
    }

    async update(id: string, dto: UpdateRegionDto): Promise<BaseResponse<any>> {
        try {
            const existing = await this.prisma.region.findUnique({ where: { id } });
            if (!existing) throw new NotFoundException('Région non trouvée');

            const updated = await this.prisma.region.update({
                where: { id },
                data: { nom: dto.nom, statut: dto.statut, districtId: dto.districtId },
            });

            return new BaseResponse(200, 'Région mise à jour', updated);
        } catch {
            throw new InternalServerErrorException('Erreur lors de la mise à jour');
        }
    }

    async remove(id: string): Promise<BaseResponse<any>> {
        try {
            await this.prisma.region.delete({ where: { id } });
            return new BaseResponse(200, 'Région supprimée', null);
        } catch (error) {
            if (error.code === 'P2025') throw new NotFoundException('Région non trouvée');
            throw new InternalServerErrorException('Erreur lors de la suppression');
        }
    }
}


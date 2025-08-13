import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { CreateDistrictDto, UpdateDistrictDto } from 'src/dto/request/district.dto';
import { FunctionService, PaginateOptions } from 'src/utils/pagination.service';

@Injectable()
export class DistrictService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly functionService: FunctionService,
    ) { }


    async getAllparginate(page: number, limit: number): Promise<BaseResponse<any>> {
        try {
            const paginateOptions: PaginateOptions = {
                model: 'District',
                page: Number(page),
                limit: Number(limit),
                selectAndInclude: {
                    select: null,
                    include: {
                        // regions: true,
                    },
                },
                orderBy: { nom: 'asc' },
            };

            const data = await this.functionService.paginate(paginateOptions);

            return new BaseResponse(200, 'Liste paginée des districts', data);
        } catch (error) {
            console.error('Erreur lors de la récupération des districts :', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des districts');
        }
    }

    async findAll(): Promise<BaseResponse<any>> {
        const data = await this.prisma.district.findMany({ orderBy: { nom: 'asc' } });
        return new BaseResponse(200, 'Liste des districts', data);
    }

    async findOne(id: string): Promise<BaseResponse<any>> {
        const item = await this.prisma.district.findUnique({ where: { id } });
        if (!item) throw new NotFoundException('District non trouvé');
        return new BaseResponse(200, 'District trouvé', item);
    }

    async update(id: string, dto: UpdateDistrictDto): Promise<BaseResponse<any>> {
        try {
            const existing = await this.prisma.district.findUnique({ where: { id } });
            if (!existing) throw new NotFoundException('District non trouvé');

            const updated = await this.prisma.district.update({
                where: { id },
                data: { nom: dto.nom, statut: dto.statut },
            });

            return new BaseResponse(200, 'District mis à jour', updated);
        } catch {
            throw new InternalServerErrorException('Erreur lors de la mise à jour');
        }
    }

    async remove(id: string): Promise<BaseResponse<any>> {
        try {
            await this.prisma.district.delete({ where: { id } });
            return new BaseResponse(200, 'District supprimé', null);
        } catch (error) {
            if (error.code === 'P2025') throw new NotFoundException('District non trouvé');
            throw new InternalServerErrorException('Erreur lors de la suppression');
        }
    }


}

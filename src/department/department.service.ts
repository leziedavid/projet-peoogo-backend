import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { CreateDepartmentDto, UpdateDepartmentDto } from 'src/dto/request/department.dto';
import { FunctionService, PaginateOptions } from 'src/utils/pagination.service';

@Injectable()
export class DepartmentService {
    constructor(private readonly prisma: PrismaService,
    private readonly functionService: FunctionService,
    ) { }


    async  getAllparginate(page: number, limit: number): Promise<BaseResponse<any>> {
        try {
            const paginateOptions: PaginateOptions = {
                model: 'Department',
                page: Number(page),
                limit: Number(limit),
                selectAndInclude: {
                    select: null,
                    include: {
                        region: true,
                    },
                },
                orderBy: { nom: 'asc' },
            };

            const data = await this.functionService.paginate(paginateOptions);

            return new BaseResponse(200, 'Liste paginée des départements', data);
        } catch (error) {
            console.error('Erreur lors de la récupération des départements :', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des départements');
        }
    }

    async findAll(): Promise<BaseResponse<any>> {
        const data = await this.prisma.department.findMany({
            orderBy: { nom: 'asc' },
            include: { region: true },
        });
        return new BaseResponse(200, 'Liste des départements', data);
    }

    async findOne(id: string): Promise<BaseResponse<any>> {
        const item = await this.prisma.department.findUnique({
            where: { id },
            include: { region: true },
        });
        if (!item) throw new NotFoundException('Département non trouvé');
        return new BaseResponse(200, 'Département trouvé', item);
    }

    async update(id: string, dto: UpdateDepartmentDto): Promise<BaseResponse<any>> {
        try {
            const existing = await this.prisma.department.findUnique({ where: { id } });
            if (!existing) throw new NotFoundException('Département non trouvé');

            const updated = await this.prisma.department.update({
                where: { id },
                data: {
                    nom: dto.nom,
                    regionId: dto.regionId,
                },
            });

            return new BaseResponse(200, 'Département mis à jour', updated);
        } catch {
            throw new InternalServerErrorException('Erreur lors de la mise à jour');
        }
    }

    async remove(id: string): Promise<BaseResponse<any>> {
        try {
            await this.prisma.department.delete({ where: { id } });
            return new BaseResponse(200, 'Département supprimé', null);
        } catch (error) {
            if (error.code === 'P2025') throw new NotFoundException('Département non trouvé');
            throw new InternalServerErrorException('Erreur lors de la suppression');
        }
    }
}

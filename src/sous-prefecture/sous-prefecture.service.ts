
import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { UpdateSousPrefectureDto } from 'src/dto/request/sous_prefecture.dto';
import { FunctionService, PaginateOptions } from 'src/utils/pagination.service';

@Injectable()
export class SousPrefectureService {
    constructor(private readonly prisma: PrismaService,
            private readonly functionService: FunctionService,
    ) { }


async getAllparginate(page: number, limit: number): Promise<BaseResponse<any>> {
    try {
        const paginateOptions: PaginateOptions = {
            model: 'SousPrefecture', // ✅ si ta méthode supporte les noms de modèles comme string
            page: Number(page),
            limit: Number(limit),
            selectAndInclude: {
                select: null,
                include: {
                    department: true,
                },
            },
            orderBy: { nom: 'asc' },
        };

        const data = await this.functionService.paginate(paginateOptions);

        return new BaseResponse(200, 'Liste paginée des sous-préfectures', data);
    } catch (error) {
        console.error('Erreur lors de la récupération des sous-préfectures :', error);
        throw new InternalServerErrorException('Erreur lors de la récupération des sous-préfectures');
    }
}


    async findAll(): Promise<BaseResponse<any>> {
        const data = await this.prisma.sousPrefecture.findMany({
            orderBy: { nom: 'asc' },
            include: { department: true },
        });
        return new BaseResponse(200, 'Liste des sous-préfectures', data);
    }

    async findOne(id: string): Promise<BaseResponse<any>> {
        const item = await this.prisma.sousPrefecture.findUnique({
            where: { id },
            include: { department: true },
        });
        if (!item) throw new NotFoundException('Sous-préfecture non trouvée');
        return new BaseResponse(200, 'Sous-préfecture trouvée', item);
    }

    async update(id: string, dto: UpdateSousPrefectureDto): Promise<BaseResponse<any>> {
        try {
            const existing = await this.prisma.sousPrefecture.findUnique({ where: { id } });
            if (!existing) throw new NotFoundException('Sous-préfecture non trouvée');

            const updated = await this.prisma.sousPrefecture.update({
                where: { id },
                data: {
                    nom: dto.nom,
                    departmentId: dto.departmentId,
                },
            });

            return new BaseResponse(200, 'Sous-préfecture mise à jour', updated);
        } catch {
            throw new InternalServerErrorException('Erreur lors de la mise à jour');
        }
    }

    async remove(id: string): Promise<BaseResponse<any>> {
        try {
            await this.prisma.sousPrefecture.delete({ where: { id } });
            return new BaseResponse(200, 'Sous-préfecture supprimée', null);
        } catch (error) {
            if (error.code === 'P2025') throw new NotFoundException('Sous-préfecture non trouvée');
            throw new InternalServerErrorException('Erreur lors de la suppression');
        }
    }
}


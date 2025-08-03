
import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { UpdateSousPrefectureDto } from 'src/dto/request/sous_prefecture.dto';

@Injectable()
export class SousPrefectureService {
    constructor(private readonly prisma: PrismaService) { }

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


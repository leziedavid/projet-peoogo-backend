import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { CreateLocaliteDto, UpdateLocaliteDto } from 'src/dto/request/localite.dto';

@Injectable()
export class LocaliteService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(): Promise<BaseResponse<any>> {
        const data = await this.prisma.localite.findMany({
            orderBy: { nom: 'asc' },
            include: { sousPrefecture: true },
        });
        return new BaseResponse(200, 'Liste des localités', data);
    }

    async findOne(id: string): Promise<BaseResponse<any>> {
        const item = await this.prisma.localite.findUnique({
            where: { id },
            include: { sousPrefecture: true },
        });
        if (!item) throw new NotFoundException('Localité non trouvée');
        return new BaseResponse(200, 'Localité trouvée', item);
    }

    async update(id: string, dto: UpdateLocaliteDto): Promise<BaseResponse<any>> {
        try {
            const existing = await this.prisma.localite.findUnique({ where: { id } });
            if (!existing) throw new NotFoundException('Localité non trouvée');

            const updated = await this.prisma.localite.update({
                where: { id },
                data: {
                    nom: dto.nom,
                    sousPrefectureId: dto.sousPrefectureId,
                },
            });

            return new BaseResponse(200, 'Localité mise à jour', updated);
        } catch {
            throw new InternalServerErrorException('Erreur lors de la mise à jour');
        }
    }

    async remove(id: string): Promise<BaseResponse<any>> {
        try {
            await this.prisma.localite.delete({ where: { id } });
            return new BaseResponse(200, 'Localité supprimée', null);
        } catch (error) {
            if (error.code === 'P2025') throw new NotFoundException('Localité non trouvée');
            throw new InternalServerErrorException('Erreur lors de la suppression');
        }
    }
}

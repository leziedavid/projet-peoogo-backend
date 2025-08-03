// utils/decoupage.utils.ts
import { PrismaService } from 'src/prisma/prisma.service';

export async function resolveDecoupageId(filters: {districtId?: string;regionId?: string;departmentId?: string;sousPrefectureId?: string;localiteId?: string;}, prisma: PrismaService): Promise<string | null> {
    const decoupage = await prisma.decoupage.findFirst({
        where: {
            districtId: filters.districtId ?? undefined,
            regionId: filters.regionId ?? undefined,
            departmentId: filters.departmentId ?? undefined,
            sousPrefectureId: filters.sousPrefectureId ?? undefined,
            localiteId: filters.localiteId ?? undefined,
        },
        select: { id: true },
    });

    return decoupage?.id ?? null;
}

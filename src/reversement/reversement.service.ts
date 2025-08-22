import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';
import { FunctionService, PaginateOptions } from 'src/utils/pagination.service';
import { EnrichedProducer } from 'src/interface/EnrichedProducer';
import { TransactionType } from '@prisma/client';
import { ReversementDto } from 'src/dto/request/reversement.dto';

@Injectable()
export class ReversementService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly functionService: FunctionService,
    ) { }

    // 📌 Générateur de code unique
    private async generateCode(prefix: string, model: 'transaction' | 'reversement'): Promise<string> {
        const random = Math.floor(100000 + Math.random() * 900000); // 6 chiffres
        const code = `${prefix}${random}`;

        let exists;
        if (model === 'transaction') {
            exists = await this.prisma.transaction.findFirst({ where: { transactionNumber: code } });
        } else if (model === 'reversement') {
            exists = await this.prisma.reversement.findFirst({ where: { transactionNumber: code } });
        }

        if (exists) return this.generateCode(prefix, model); // récursion si déjà pris
        return code;
    }

    // 📌 Créer un reversement
    async createReversement(dto: ReversementDto): Promise<BaseResponse<any>> {
        const { producerId, orderId, totalQuantity, totalAmount,codeGenerate } = dto;

        // 🔹 Vérifier producteur + wallet
        const producer = await this.prisma.user.findUnique({
            where: { id: producerId },
            include: { wallet: true },
        });
        if (!producer || !producer.wallet) {
            throw new NotFoundException(`Producteur ou wallet introuvable`);
        }

        // 🔹 Vérifier commande
        const order = await this.prisma.ecommerceOrder.findUnique({ where: { id: orderId } });
        if (!order) throw new NotFoundException(`Commande ${orderId} introuvable`);

        // 🔹 Recalculer montants côté backend
        const platformCommission = totalAmount * 0.18;
        const producerEarnings = totalAmount - platformCommission;

        // 🔹 Wallet plateforme (admin)
        const admin = await this.prisma.user.findFirst({
            where: { role: "ADMIN" },
            include: { wallet: true },
        });
        if (!admin || !admin.wallet) throw new NotFoundException(`Wallet de la plateforme introuvable`);

        // 🔹 Créer reversement + transactions atomiquement
        const reversement = await this.prisma.$transaction(async (tx) => {

            // Générer code unique pour le reversement
            const reversementCode = await this.generateCode("REV", "reversement");
            const transactionNumberProducer = await this.generateCode("TRX", "transaction");
            const transactionNumberOrder = await this.generateCode("TRX", "transaction");

            // Transaction producteur
            const transactionProducer = await tx.transaction.create({
                data: {
                    amount: producerEarnings,
                    transactionNumber: transactionNumberProducer,
                    type: "DEPOSIT",
                    walletId: producer.wallet.id,
                    userId: producer.id,
                    reference: await this.generateCode("TRX", "transaction"),
                    description: `Reversement pour la commande ${orderId}`,
                },
            });

            // Transaction plateforme
            await tx.transaction.create({
                data: {
                    amount: platformCommission,
                    transactionNumber: transactionNumberOrder,
                    type: "DEPOSIT",
                    walletId: admin.wallet.id,
                    userId: admin.id,
                    reference: await this.generateCode("TRX", "transaction"),
                    description: `Commission plateforme pour la commande ${orderId}`,
                },
            });

            // Mise à jour des soldes
            await tx.wallet.update({
                where: { id: producer.wallet.id },
                data: { balance: { increment: producerEarnings } },
            });

            await tx.wallet.update({
                where: { id: admin.wallet.id },
                data: { balance: { increment: platformCommission } },
            });

            // ✅ Mise à jour des items liés à la commande → marquer comme reversés
            await tx.ecommerceOrderItem.updateMany({
                where: {
                    ecommerceOrderId: orderId,
                    product: {codeUsers: codeGenerate }, // ⚠️ on filtre pour être sûr que c'est bien le producteur
                },
                data: { reverser: 1 },
            });

            // Créer le reversement avec référence à la transaction du producteur
            return await tx.reversement.create({
                data: {
                    producerId,
                    orderId,
                    totalQuantity,
                    totalAmount,
                    platformCommission,
                    producerEarnings,
                    walletId: producer.wallet.id,
                    transactionId: transactionProducer.id,
                    transactionNumber: reversementCode,
                },
            });
        });

        return new BaseResponse(201, 'Reversement créé avec succès', reversement);
    }




    // 📌 Récupérer tous les reversements avec pagination
    async getAllReversements(params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page, limit } = params;
        const paginateOptions: PaginateOptions = {
            model: 'Reversement',
            page: Number(page),
            limit: Number(limit),
            selectAndInclude: {
                select: null,
                include: {
                    producer: true,
                    order: true,
                    transaction: true,
                    wallet: true,
                },
            },
        };
        const data = await this.functionService.paginate(paginateOptions);
        return new BaseResponse(200, 'Liste des reversements', data);
    }

    // 📌 Récupérer un reversement par ID
    async getReversementById(id: string): Promise<BaseResponse<any>> {
        const reversement = await this.prisma.reversement.findUnique({
            where: { id },
            include: { producer: true, order: true, transaction: true, wallet: true },
        });
        if (!reversement) throw new NotFoundException('Reversement introuvable');
        return new BaseResponse(200, 'Détails du reversement', reversement);
    }

    // 📌 Supprimer un reversement
    async delete(id: string): Promise<BaseResponse<any>> {
        await this.prisma.reversement.delete({ where: { id } });
        return new BaseResponse(200, 'Reversement supprimé avec succès', null);
    }


     // 🔹 Récupérer les reversements d’un producteur avec pagination
    async getReversementsByProducer(producerId: string, pagination: PaginationParamsDto) {
        const { page = 1, limit = 10 } = pagination;
        const skip = (page - 1) * limit;

        const reversements = await this.prisma.reversement.findMany({
            where: { producerId },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: { transaction: true, wallet: true, order: true },
        });

        const total = await this.prisma.reversement.count({ where: { producerId } });

        return new BaseResponse(200, 'Reversements récupérés avec succès', {
            data: reversements,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    }

    // 🔹 Statistiques globales des reversements et gains
    async getReversementStats() {
        const stats = await this.prisma.reversement.aggregate({
            _sum: {
                totalAmount: true,
                platformCommission: true,
                producerEarnings: true,
            },
            _count: {
                id: true,
            },
        });

        return new BaseResponse(200, 'Statistiques récupérées avec succès', {
            totalReversements: stats._count.id,
            totalAmount: stats._sum.totalAmount || 0,
            totalPlatformCommission: stats._sum.platformCommission || 0,
            totalProducerEarnings: stats._sum.producerEarnings || 0,
        });
    }

}

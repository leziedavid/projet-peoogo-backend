import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, ForbiddenException, } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EcommerceOrderItem, OderPaiementStatus, OrderStatus, Prisma } from '@prisma/client';
import { CreateEcommerceOrderDto } from 'src/dto/request/ecommerce-order.dto';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';
import { FunctionService, PaginateOptions } from 'src/utils/pagination.service';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { use } from 'passport';
import { EnrichedProducer } from 'src/interface/EnrichedProducer';
import { getPublicFileUrl } from 'src/utils/helper';


@Injectable()
export class EcommerceOrderService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly functionService: FunctionService,

    ) { }

    private async generateOrderNumber(): Promise<string> {
        const datePart = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        return `CMD-${datePart}-${randomPart}`;
    }
    private async getProductImages(productId: string): Promise<string[]> {
        const files = await this.prisma.fileManager.findMany({
            where: {
                fileType: 'productFiles',
                targetId: productId,
            },
            orderBy: { createdAt: 'asc' },
        });

        // console.log('🚀 files:', files);
        // Transforme les fileUrl relatifs en URL publiques complètes
        return files.map(file => getPublicFileUrl(file.fileUrl));
    }

    async createOrderOne(dto: CreateEcommerceOrderDto, userId: string) {
        const productIds = dto.items.map(i => i.productId);

        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds } },
        });

        if (products.length !== productIds.length) {
            throw new BadRequestException('Un ou plusieurs produits n’existent pas');
        }

        const calculatedAmount = dto.items.reduce((acc, item) => {
            const prod = products.find(p => p.id === item.productId);
            if (!prod) {
                throw new BadRequestException(`Produit introuvable: ${item.productId}`);
            }
            return acc + prod.prixUnitaire * item.quantity;
        }, 0);

        if (Math.abs(calculatedAmount - dto.amount) > 0.01) {
            throw new BadRequestException('Montant total invalide');
        }

        const orderNumber = await this.generateOrderNumber();

        // Ici, on utilise bien "prixUnitaire" (et pas "price")
        const orderItems: Prisma.EcommerceOrderItemUncheckedCreateWithoutEcommerceOrderInput[] =
            dto.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                prixUnitaire: item.price,
            }));


        // Détermine le statut de paiement à partir du booléen
        let paymentStatus: OderPaiementStatus;
        if (dto.paiementStatus === true) {
            paymentStatus = OderPaiementStatus.PAYE;
        } else if (dto.paiementStatus === false) {
            paymentStatus = OderPaiementStatus.ECHEC;
        } else {
            paymentStatus = OderPaiementStatus.EN_ATTENTE_DE_PAIEMENT;
        }

        try {
            const order = await this.prisma.ecommerceOrder.create({
                data: {
                    ordersNumber: orderNumber,
                    userId,
                    paymentMethod: dto.paymentMethod,
                    deliveryMethod: dto.deliveryMethod,
                    amount: dto.amount,
                    status: OrderStatus.PENDING,
                    paymentStatus: paymentStatus,
                    network: dto.network,
                    paiementNumber: dto.paiementNumber,
                    addedById: userId,
                    items: {
                        create: orderItems,
                    },
                },
                include: { items: true },
            });


            return new BaseResponse(201, 'Commande créée avec succès', order);
        } catch (error) {
            throw new InternalServerErrorException('Erreur lors de la création de la commande');
        }
    }

    async createOrder(dto: CreateEcommerceOrderDto, userId: string) {
        const productIds = dto.items.map(i => i.productId);

        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds } },
        });

        if (products.length !== productIds.length) {
            throw new BadRequestException('Un ou plusieurs produits n’existent pas');
        }

        const calculatedAmount = dto.items.reduce((acc, item) => {
            const prod = products.find(p => p.id === item.productId);
            if (!prod) {
                throw new BadRequestException(`Produit introuvable: ${item.productId}`);
            }

            // ✅ Vérifier la quantité disponible
            if (prod.quantite < item.quantity) {
                throw new BadRequestException(
                    `Stock insuffisant pour le produit ${prod.nom} (disponible: ${prod.quantite}, demandé: ${item.quantity})`
                );
            }

            return acc + prod.prixUnitaire * item.quantity;
        }, 0);

        if (Math.abs(calculatedAmount - dto.amount) > 0.01) {
            throw new BadRequestException('Montant total invalide');
        }

        const orderNumber = await this.generateOrderNumber();

        const orderItems: Prisma.EcommerceOrderItemUncheckedCreateWithoutEcommerceOrderInput[] =
            dto.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                prixUnitaire: item.price,
            }));

        let paymentStatus: OderPaiementStatus;
        if (dto.paiementStatus === true) {
            paymentStatus = OderPaiementStatus.PAYE;
        } else if (dto.paiementStatus === false) {
            paymentStatus = OderPaiementStatus.ECHEC;
        } else {
            paymentStatus = OderPaiementStatus.EN_ATTENTE_DE_PAIEMENT;
        }

        try {
            // ✅ Transaction : création commande + décrément stock
            const order = await this.prisma.$transaction(async (tx) => {
                const createdOrder = await tx.ecommerceOrder.create({
                    data: {
                        ordersNumber: orderNumber,
                        userId,
                        paymentMethod: dto.paymentMethod,
                        deliveryMethod: dto.deliveryMethod,
                        amount: dto.amount,
                        status: OrderStatus.PENDING,
                        paymentStatus: paymentStatus,
                        network: dto.network,
                        paiementNumber: dto.paiementNumber,
                        addedById: userId,
                        items: { create: orderItems },
                    },
                    include: { items: true },
                });

                // 🔥 Décrémenter les quantités des produits
                for (const item of dto.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            quantite: {
                                decrement: item.quantity,
                            },
                        },
                    });
                }

                return createdOrder;
            });

            return new BaseResponse(201, 'Commande créée avec succès', order);
        } catch (error) {
            throw new InternalServerErrorException('Erreur lors de la création de la commande');
        }
    }


    async getOrderById(id: string) {
        const order = await this.prisma.ecommerceOrder.findUnique({
            where: { id },
            include: {
                items: { include: { product: true } },
                user: true,
            },
        });

        if (!order) {
            throw new NotFoundException('Commande introuvable');
        }

        return new BaseResponse(200, 'Commande récupérée avec succès', order);
    }

    async deleteOrder(orderId: string, userId: string) {
        const order = await this.prisma.ecommerceOrder.findUnique({ where: { id: orderId } });

        if (!order) {
            throw new NotFoundException('Commande introuvable');
        }

        if (order.userId !== userId) {
            throw new ForbiddenException("Vous n'êtes pas autorisé à supprimer cette commande");
        }

        await this.prisma.ecommerceOrderItem.deleteMany({
            where: { ecommerceOrderId: orderId },
        });

        await this.prisma.ecommerceOrder.delete({
            where: { id: orderId },
        });

        return new BaseResponse(200, 'Commande supprimée avec succès', '');
    }

    async updateOrderStatus(orderId: string, newStatus: OrderStatus, userId: string): Promise<BaseResponse<any>> {
        const order = await this.prisma.ecommerceOrder.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: { product: true },
                },
            },
        });

        if (!order) {
            throw new NotFoundException('Commande introuvable');
        }

        if (order.status === OrderStatus.CANCELLED) {
            throw new BadRequestException('Impossible de modifier une commande annulée');
        }

        // Vérifie que l'utilisateur est le créateur d'au moins un produit de la commande
        const isCreator = order.items.some(item => item.product.addedById === userId);

        // if (!isCreator) {
        //     throw new ForbiddenException("Vous n'êtes pas autorisé à modifier cette commande");
        // }

        const updated = await this.prisma.ecommerceOrder.update({
            where: { id: orderId },
            data: { status: newStatus },
            include: {
                items: { include: { product: true } },
                user: true,
            },
        });

        return new BaseResponse(200, 'Statut mis à jour avec succès', updated);
    }

    async cancelOrder(orderId: string, userId: string) {
        const order = await this.prisma.ecommerceOrder.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            throw new NotFoundException('Commande introuvable');
        }

        if (order.userId !== userId) {
            throw new ForbiddenException("Vous n'êtes pas autorisé à annuler cette commande");
        }

        if (order.status === OrderStatus.CANCELLED) {
            throw new BadRequestException('Commande déjà annulée');
        }

        const updated = await this.prisma.ecommerceOrder.update({
            where: { id: orderId },
            data: {
                status: OrderStatus.CANCELLED,
                canceledAt: new Date(),
            },
            include: {
                items: true,
            },
        });

        return new BaseResponse(200, 'Commande annulée avec succès', updated);
    }

    async getAllOrdersOne(params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const options: PaginateOptions = {
            model: 'EcommerceOrder',
            page: Number(params.page),
            limit: Number(params.limit),
            orderBy: { createdAt: 'desc' },
            selectAndInclude: {
                include: {
                    user: true,
                    items: {
                        include: { product: true },
                    },
                },
                select: null,
            },
        };

        const data = await this.functionService.paginate(options);
        return new BaseResponse(200, 'Liste paginée des commandes', data);
    }

    async getOrdersByUserId(userId: string, params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const options: PaginateOptions = {
            model: 'EcommerceOrder',
            page: Number(params.page),
            limit: Number(params.limit),
            conditions: {
                userId,
                status: {
                    notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
                },
            },
            orderBy: { createdAt: 'desc' },
            selectAndInclude: {
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                    user: {
                        select: {
                            name: true,
                            email: true,
                            phoneNumber: true,
                        },
                    },
                },
                select: null,
            },
        };

        const data = await this.functionService.paginate(options);

        // Transformer les items pour inclure l'image transformée
        const orders = data.data.map((order: any) => {
            const transformedItems = order.items.map((item: any) => {
                const product = item.product;
                return {
                    ...item,
                    product: {
                        ...product,
                        imageUrl: product?.imageUrl ? getPublicFileUrl(product.imageUrl) : "/placeholder.png",
                    },
                };
            });

            return {
                ...order,
                items: transformedItems,
            };
        });

        const result = {
            ...data,
            data: orders,
        };

        return new BaseResponse(200, 'Commandes utilisateur paginées', result);
    }

    async getOrdersHistoryByUserId(userId: string, params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const options: PaginateOptions = {
            model: 'EcommerceOrder',
            page: Number(params.page),
            limit: Number(params.limit),
            conditions: {
                userId,
                status: {
                    in: [OrderStatus.CANCELLED, OrderStatus.COMPLETED],
                },
            },
            orderBy: { createdAt: 'desc' },
            selectAndInclude: {
                include: {
                    items: { include: { product: true } },
                    user: true,
                },
                select: null,
            },
        };

        const data = await this.functionService.paginate(options);

        // Transformer les items pour inclure l'image du produit
        const orders = data.data.map((order: any) => {
            const transformedItems = order.items.map((item: any) => ({
                ...item,
                product: {
                    ...item.product,
                    imageUrl: item.product?.imageUrl ? getPublicFileUrl(item.product.imageUrl) : "/placeholder.png",
                },
            }));

            return {
                ...order,
                items: transformedItems,
            };
        });

        return new BaseResponse(200, 'Commandes utilisateur paginées', { ...data, data: orders });
    }

    async getOrdersByProductCreator(creatorId: string, params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const options: PaginateOptions = {
            model: 'EcommerceOrder',
            page: Number(params.page),
            limit: Number(params.limit),
            conditions: {
                items: {
                    some: {
                        product: {
                            addedById: creatorId,
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            selectAndInclude: {
                include: {
                    user: true,
                    items: { include: { product: true } },
                },
                select: null,
            },
        };

        const data = await this.functionService.paginate(options);

        // Transformer les items pour inclure l'image du produit
        const orders = data.data.map((order: any) => {
            const transformedItems = order.items.map((item: any) => ({
                ...item,
                product: {
                    ...item.product,
                    imageUrl: item.product?.imageUrl ? getPublicFileUrl(item.product.imageUrl) : "/placeholder.png",
                },
            }));

            return {
                ...order,
                items: transformedItems,
            };
        });

        return new BaseResponse(200, 'Commandes liées aux produits créés', { ...data, data: orders });
    }


    async getOrderStatsAndGains(): Promise<BaseResponse<any>> {
        // Comptages globaux
        const [
            totalOrders,
            totalOrdersCancelled,
            totalOrdersValidated,
            totalOrdersCompleted,
            totalRevenueAggregate,
        ] = await Promise.all([
            // total commandes
            this.prisma.ecommerceOrder.count(),

            // total commandes annulées
            this.prisma.ecommerceOrder.count({
                where: { status: OrderStatus.CANCELLED },
            }),

            // total commandes validées (VALIDATED)
            this.prisma.ecommerceOrder.count({
                where: { status: OrderStatus.VALIDATED },
            }),

            // total commandes terminées (COMPLETED)
            this.prisma.ecommerceOrder.count({
                where: { status: OrderStatus.COMPLETED },
            }),

            // somme des montants (gains) sur toutes les commandes (par exemple status COMPLETED)
            this.prisma.ecommerceOrder.aggregate({
                where: { status: OrderStatus.COMPLETED },
                _sum: { amount: true },
            }),
        ]);

        return new BaseResponse(200, 'Statistiques globales des commandes', {
            totalOrders,
            totalOrdersCancelled,
            totalOrdersValidated,
            totalOrdersCompleted,
            totalGains: totalRevenueAggregate._sum.amount || 0,
        });
    }

    async getOrdersAndRevenueStats(
        startDate?: Date,
        endDate?: Date,
    ): Promise<BaseResponse<any>> {
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(end.getMonth() - 11));

        // Construction de la liste des mois entre start et end, format yyyy-MM
        const months: string[] = [];
        const current = new Date(start);
        while (current <= end) {
            months.push(format(current, 'yyyy-MM'));
            current.setMonth(current.getMonth() + 1);
        }

        // Récupération des commandes "COMPLETED" dans la plage
        const orders = await this.prisma.ecommerceOrder.findMany({
            where: {
                status: OrderStatus.COMPLETED,
                createdAt: {
                    gte: startOfMonth(start),
                    lte: endOfMonth(end),
                },
            },
            select: {
                amount: true,
                createdAt: true,
            },
        });

        // Regroupement des commandes par mois (yyyy-MM) avec total montant et compte
        const grouped = new Map<string, { orders: number; revenue: number }>();
        for (const order of orders) {
            const key = format(order.createdAt, 'yyyy-MM');
            if (!grouped.has(key)) {
                grouped.set(key, { orders: 0, revenue: 0 });
            }
            const current = grouped.get(key)!;
            current.orders += 1;
            current.revenue += order.amount ?? 0;
        }

        // Organisation des données dans l'ordre chronologique (janvier → décembre)
        const merged = months.map(label => ({
            label,
            monthNumber: parseInt(label.split('-')[1], 10), // extrait le mois
            orders: grouped.get(label)?.orders ?? 0,
            revenue: grouped.get(label)?.revenue ?? 0,
        }));

        merged.sort((a, b) => a.monthNumber - b.monthNumber);

        // Extraction des données à retourner
        const labels = merged.map(item => item.label);
        const ordersData = merged.map(item => item.orders);
        const revenueData = merged.map(item => item.revenue);

        return new BaseResponse(200, 'Statistiques commandes et revenus par mois (Janv → Déc)', {
            labels,
            orders: ordersData,
            revenue: revenueData,
        });
    }


    // --- Exemple de méthode publique ---
    async getAllOrdersWithProducers(params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const options: PaginateOptions = {
            model: 'EcommerceOrder',
            page: Number(params.page),
            limit: Number(params.limit),
            orderBy: { createdAt: 'desc' },
            selectAndInclude: {
                include: {
                    user: true,
                    items: {
                        include: {
                            product: {
                                include: {
                                    addedBy: true,
                                },
                            },
                        },
                    },
                },
                select: null,
            },
        };

        const data = await this.functionService.paginate(options);

        // Enrichir chaque commande
        for (const order of data.data) {
            await this.enrichOrderItems(order.items);
        }

        return new BaseResponse(200, 'Liste paginée des commandes avec producteurs', data);
    }

    /**
     * Enrichit les items d'une commande avec le producteur réel et ses stats
     */

    private async enrichOrderItems(
        items: (EcommerceOrderItem & { product?: any })[]
    ) {
        const producerCache: Record<string, EnrichedProducer> = {};

        for (const item of items) {
            const product = item.product;
            if (!product || !product.codeUsers) continue;

            // Récupérer et attacher le producteur
            const producer = await this.getProducer(product.codeUsers, producerCache);
            this.addItemStatsToProducer(producer, item);
            product.producer = producer;
            product.imageUrl = getPublicFileUrl(product.imageUrl);
        }
    }


    private async enrichOrderItems1(items: (EcommerceOrderItem & { product?: any })[]) {
        const producerCache: Record<string, EnrichedProducer> = {};
        console.log('items:', items);
        for (const item of items) {
            const product = item.product;
            if (!product || !product.codeUsers) continue;
            const producer = await this.getProducer(product.codeUsers, producerCache);
            this.addItemStatsToProducer(producer, item);
            product.producer = producer;
            // ajouter le reverser
        }
    }

    /**
     * Récupère le producteur réel via codeUsers
     */
    private async getProducer(codeUsers: string, cache: Record<string, EnrichedProducer>): Promise<EnrichedProducer> {
        if (!cache[codeUsers]) {
            const producer = await this.prisma.user.findFirst({
                where: { codeGenerate: codeUsers } as Prisma.UserWhereUniqueInput,
                select: {
                    id: true,
                    name: true,
                    phoneNumber: true,
                    typeCompte: true,
                    codeGenerate: true,
                },
            });

            if (!producer) {
                throw new NotFoundException(`Producteur avec code ${codeUsers} introuvable`);
            }

            cache[codeUsers] = {
                ...producer,
                totalQuantity: 0,
                totalAmount: 0,
                reverser: 0,
            };
        }

        return cache[codeUsers];
    }

    /**
     * Ajoute les stats d'un item à un producteur enrichi
     */
    private addItemStatsToProducer(producer: EnrichedProducer, item: EcommerceOrderItem) {
        producer.totalQuantity += item.quantity;
        producer.totalAmount += item.quantity * item.prixUnitaire;
        producer.reverser = item.reverser;
    }



}

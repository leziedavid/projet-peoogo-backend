import {Injectable,NotFoundException,InternalServerErrorException,BadRequestException,ForbiddenException,} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/utils/cloudinary.service';
import { CreateProductDto, UpdateProductDto } from 'src/dto/request/product.dto';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { Express } from 'express';
import { CreateDecoupageDto } from 'src/dto/request/decoupage.dto';
import { ProductStatus, TypeCompte } from '@prisma/client';
import { FunctionService, PaginateOptions } from 'src/utils/pagination.service';

@Injectable()
export class ProductService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinary: CloudinaryService,
        private readonly functionService: FunctionService,
    ) { }

    private async generateUniqueProductCode(): Promise<string> {
        const lastProduct = await this.prisma.product.findFirst({
            orderBy: { code: 'desc' },
            where: {
                code: {
                    startsWith: 'PROD-'
                }
            }
        });

        let nextNumber = 1;
        if (lastProduct?.code) {
            const lastNumber = parseInt(lastProduct.code.replace('PROD-', ''));
            if (!isNaN(lastNumber)) nextNumber = lastNumber + 1;
        }

        return `PROD-${String(nextNumber).padStart(4, '0')}`;
    }

    // Recherche un Decoupage correspondant aux critères ou lève une erreur
    private async findDecoupageOrFail(dtoDecoupage: Partial<CreateDecoupageDto>) {
        const decoupage = await this.prisma.decoupage.findFirst({
            where: {
                districtId: dtoDecoupage.districtId,
                regionId: dtoDecoupage.regionId,
                departmentId: dtoDecoupage.departmentId,
                sousPrefectureId: dtoDecoupage.sousPrefectureId,
                localiteId: dtoDecoupage.localiteId,
            },
        });

        if (!decoupage) {
            throw new NotFoundException('Découpage non trouvé avec ces critères');
        }
        return decoupage;
    }

    private async uploadAndSaveSingleFile(productId: string, fileBuffer: Buffer | string, fileType: string, folder: string,): Promise<void> {
        // Chercher fichier existant et supprimer
        const existingFile = await this.prisma.fileManager.findFirst({
            where: { targetId: productId, fileType },
            orderBy: { createdAt: 'desc' },
        });

        if (existingFile?.fileCode) {
            try {
                await this.cloudinary.deleteFileByPublicId(existingFile.fileCode);
            } catch (error) {
                console.warn(`Erreur suppression Cloudinary ${existingFile.fileCode}: ${error.message}`);
            }
            await this.prisma.fileManager.deleteMany({
                where: { targetId: productId, fileType },
            });
        }

        // Upload fichier
        const uploadResult = await this.cloudinary.uploadFile(fileBuffer, folder);

        // Sauvegarde en DB
        await this.prisma.fileManager.create({
            data: {
                ...uploadResult,
                fileType,
                targetId: productId,
            },
        });
    }

    private async getProductImages(productId: string): Promise<string[]> {
        const files = await this.prisma.fileManager.findMany({
            where: {
                fileType: 'productFiles',
                targetId: productId,
            },
            orderBy: { createdAt: 'asc' }, // ou desc si tu veux la plus récente en premier
        });

        return files.map(file => file.fileUrl);
    }

    private async getUserByCodeGenerate(rawCode: string): Promise<any[]> {

        const cleanCode = rawCode.replace(/\s+/g, '');
        const user = await this.prisma.user.findFirst({
            where: {
                codeGenerate: {
                    equals: cleanCode,
                    mode: 'insensitive',
                },
            },
            include: {
                wallet: true,
            },
        });

        const enrollement = await this.prisma.enrollements.findFirst({
            where: {
                code: {
                    equals: cleanCode,
                    mode: 'insensitive',
                },
            }
        });

        const fichier = this.getProductImages(user.id);

        // Aucun utilisateur ou enrôlement : retourne un tableau vide
        if (!user || !enrollement) {
            return [];
        }
        // On retourne sous forme de tableau d’un seul objet
        return [
            {
                id: user.id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                wallet: user.wallet,
                generatedCode: user.codeGenerate,
                code: enrollement.code,
                photo: fichier[0],
            },
        ];
    }

    async createProduct(dto: CreateProductDto, userId: string): Promise<BaseResponse<{ productId: string }>> {

        const decoupages = await this.findDecoupageOrFail(dto.decoupage);
        const { image, autreImage, prixUnitaire, prixEnGros, quantite, decoupage, ...productData } = dto as any;

        try {

            const code = await this.generateUniqueProductCode();
            const prixUnitaireNumber = parseFloat(prixUnitaire);
            const prixEnGrosNumber = parseFloat(prixEnGros);
            const quantiteNumber = parseInt(quantite, 10);

            let imageUrl = null;
            if (image) {
                const uploadResult = await this.cloudinary.uploadFile(image.buffer, 'products');
                imageUrl = uploadResult.fileUrl;
            }

            // Construction data sans decoupage
            const dataToSave: any = {
                ...productData,
                decoupageId: decoupages.id,
                nom: dto.nom,
                description: dto.description,
                saleType: dto.saleType,
                paymentMethod: dto.paymentMethod,
                disponibleDe: new Date(dto.disponibleDe),
                disponibleJusqua: new Date(dto.disponibleJusqua),
                code,
                unite: dto.unite,
                prixUnitaire: prixUnitaireNumber,
                prixEnGros: prixEnGrosNumber,
                quantite: quantiteNumber,
                typeActeur: dto.typeActeur as TypeCompte,
                status: ProductStatus.ACTIVE,
                addedById: userId,
                codeUsers: dto.codeUsers,
                imageUrl: imageUrl,
            };

            // Nettoyage : suppression si jamais 'decoupage' traîne
            if ('decoupage' in dataToSave) delete dataToSave.decoupage;

            console.log('dataToSave:', dataToSave); // DEBUG
            console.log('userId:', userId); // DEBUG

            const products = await this.prisma.product.create({
                data: dataToSave,
            });

            
                        // Upload des fichiers un par un
            if (image) {
                await this.uploadAndSaveSingleFile(products.id, image, 'productFiles', 'products');
            }


        if (autreImage && autreImage.length > 0) {
            for (const file of autreImage) {
                await this.uploadAndSaveSingleFile(products.id, file.buffer, 'productFiles', 'products');
            }
        }

            return new BaseResponse(201, 'Produit créé avec succès', { productId: products.id });

        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Erreur lors de la création du produit');
        }
    }

    async updateProduct(id: string, dto: UpdateProductDto, userId: string): Promise<BaseResponse<null>> {
        const existing = await this.prisma.product.findUnique({ where: { id } });

        if (!existing) {
            throw new NotFoundException('Produit introuvable');
        }

        const { image, autreImage, prixUnitaire, prixEnGros, quantite, decoupage, ...productData } = dto as any;

        let decoupageId = existing.decoupageId;
        if (decoupage) {
            const decoupages = await this.findDecoupageOrFail(decoupage);
            decoupageId = decoupages.id;
        }

        const fileType = 'productFiles';
        let imageUrl = null;

        const existingFile = await this.prisma.fileManager.findFirst({
            where: { targetId: id, fileType },
            orderBy: { createdAt: 'desc' },
        });

        if (existingFile?.fileCode) {
            try {
                await this.cloudinary.deleteFileByPublicId(existingFile.fileCode);
            } catch (error) {
                console.warn(`Erreur suppression Cloudinary ${existingFile.fileCode}: ${error.message}`);
            }
            await this.prisma.fileManager.deleteMany({
                where: { targetId: id, fileType },
            });
        }

        if (image) {
            const uploadResult = await this.cloudinary.uploadFile(image.buffer, 'products');
            imageUrl = uploadResult.fileUrl;
        }

        const dataToUpdate: any = {
            ...productData,
            decoupageId,
            nom: dto.nom,
            description: dto.description,
            saleType: dto.saleType,
            paymentMethod: dto.paymentMethod,
            disponibleDe: dto.disponibleDe ? new Date(dto.disponibleDe) : existing.disponibleDe,
            disponibleJusqua: dto.disponibleJusqua ? new Date(dto.disponibleJusqua) : existing.disponibleJusqua,
            unite: dto.unite,
            prixUnitaire: prixUnitaire ? parseFloat(prixUnitaire) : existing.prixUnitaire,
            prixEnGros: prixEnGros ? parseFloat(prixEnGros) : existing.prixEnGros,
            quantite: quantite ? parseInt(quantite, 10) : existing.quantite,
            typeActeur: dto.typeActeur as TypeCompte ?? existing.typeActeur,
            updatedAt: new Date(),
            codeUsers: dto.codeUsers ?? existing.codeUsers,
            imageUrl: imageUrl ?? existing.imageUrl,
        };

        // Nettoyage
        if ('decoupage' in dataToUpdate) delete dataToUpdate.decoupage;

        await this.prisma.enrollements.update({
            where: { id },
            data: dataToUpdate,
        });

        // Upload nouvelle image principale si présente
        if (image) {
            await this.uploadAndSaveSingleFile(id, image, 'productFiles', 'products');
        }

        // Upload des autres images si présentes
        if (autreImage && autreImage.length > 0) {
            for (const file of autreImage) {
                await this.uploadAndSaveSingleFile(id, file.buffer, 'productFiles', 'products');
            }
        }

        return new BaseResponse(200, 'Produit mis à jour avec succès', null);
    }

    async getProductById(id: string): Promise<BaseResponse<any>> {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: {
                decoupage: {
                    include: {
                        district: true,
                        region: true,
                        department: true,
                        sousPrefecture: true,
                        localite: true,
                    },
                },
                addedBy: true,
            },
        });

        if (!product) throw new NotFoundException('Produit introuvable');

        return new BaseResponse(200, 'Détail du produit', product);
    }

    async deleteProduct(id: string, userId: string): Promise<BaseResponse<null>> {
        const product = await this.prisma.product.findUnique({ where: { id } });
        if (!product) throw new NotFoundException('Produit introuvable');

        if (product.addedById !== userId) {
            throw new ForbiddenException('Vous n’êtes pas autorisé à supprimer ce produit');
        }

        await this.prisma.product.delete({ where: { id } });
        return new BaseResponse(200, 'Produit supprimé', null);
    }

    async getAllProducts(params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page = 1, limit = 10 } = params;
        const now = new Date();

        const paginateOptions: PaginateOptions = {
            model: 'Product',
            page: Number(page),
            limit: Number(limit),
            selectAndInclude: {
                select: null,
                include: {
                    decoupage: {
                        include: {
                            district: true,
                            region: true,
                            department: true,
                            sousPrefecture: true,
                            localite: true,
                        },
                    },
                    addedBy: true,
                },
            },
            orderBy: { disponibleDe: 'desc' },
        };

        const data = await this.functionService.paginate(paginateOptions);

        // Ajoute le statut et les images à chaque produit
        data.data = await Promise.all(
            data.data.map(async (product) => {
                const isDisponible = new Date(product.disponibleDe) <= now && new Date(product.disponibleJusqua) >= now;
                const images = await this.getProductImages(product.id);
                const userInfo = await this.getUserByCodeGenerate(product.codeUsers);

                return {
                    ...product,
                    statut: isDisponible ? 'disponible' : 'indisponible',
                    images,
                    userInfo,
                };
            }),
        );

        return new BaseResponse(200, 'Liste paginée des produits', data);
    }

    async getAllProductsIsActive(params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page = 1, limit = 10 } = params;
        const now = new Date();

        const paginateOptions: PaginateOptions = {
            model: 'Product',
            page: Number(page),
            limit: Number(limit),
            conditions: {
                disponibleDe: { lte: now },
                disponibleJusqua: { gte: now },
            },
            selectAndInclude: {
                select: null,
                include: {
                    decoupage: {
                        include: {
                            district: true,
                            region: true,
                            department: true,
                            sousPrefecture: true,
                            localite: true,
                        },
                    },
                    addedBy: true,
                },
            },
            orderBy: { disponibleDe: 'desc' },
        };

        const data = await this.functionService.paginate(paginateOptions);
        // Ajoute le statut et les images à chaque produit
        data.data = await Promise.all(
            data.data.map(async (product) => {
                const isDisponible = new Date(product.disponibleDe) <= now && new Date(product.disponibleJusqua) >= now;
                const images = await this.getProductImages(product.id);
                const userInfo = await this.getUserByCodeGenerate(product.codeUsers);

                return {
                    ...product,
                    statut: isDisponible ? 'disponible' : 'indisponible',
                    images,
                    userInfo,
                };
            }),
        );

        return new BaseResponse(200, 'Liste paginée des produits disponibles', data);
    }

    async getAllProductsWithStatus(params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page = 1, limit = 10 } = params;
        const now = new Date();

        const paginateOptions: PaginateOptions = {
            model: 'Product',
            page: Number(page),
            limit: Number(limit),
            selectAndInclude: {
                select: null,
                include: {
                    decoupage: {
                        include: {
                            district: true,
                            region: true,
                            department: true,
                            sousPrefecture: true,
                            localite: true,
                        },
                    },
                    addedBy: true,
                },
            },
            orderBy: { disponibleDe: 'desc' },
        };

        const data = await this.functionService.paginate(paginateOptions);

        // Ajoute le statut et les images à chaque produit
        data.data = await Promise.all(
            data.data.map(async (product) => {
                const isDisponible = new Date(product.disponibleDe) <= now && new Date(product.disponibleJusqua) >= now;
                const images = await this.getProductImages(product.id);
                const userInfo = await this.getUserByCodeGenerate(product.codeUsers);

                return {
                    ...product,
                    statut: isDisponible ? 'disponible' : 'indisponible',
                    images,
                    userInfo,
                };
            }),
        );

        return new BaseResponse(200, 'Tous les produits avec leur statut et images', data);
    }

    async getProducteurProductsByCode(code: string, params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page, limit } = params;
        const now = new Date();

        const paginateOptions: PaginateOptions = {
            model: 'Product',
            page: Number(page),
            limit: Number(limit),
            conditions: {
                codeUsers: code, // filtre correct basé sur ton modèle
            },
            selectAndInclude: {
                select: null,
                include: {
                    addedBy: true,
                    decoupage: {
                        include: {
                            district: true,
                            region: true,
                            department: true,
                            sousPrefecture: true,
                            localite: true,
                        },
                    },
                    EcommerceOrderItem: true, // bonne casse et nom exact
                },
            },
            orderBy: { createdAt: 'desc' }
        };

        const data = await this.functionService.paginate(paginateOptions);
        // Ajoute le statut et les images à chaque produit
        data.data = await Promise.all(
            data.data.map(async (product) => {
                const isDisponible = new Date(product.disponibleDe) <= now && new Date(product.disponibleJusqua) >= now;
                const images = await this.getProductImages(product.id);
                const userInfo = await this.getUserByCodeGenerate(product.codeUsers);

                return {
                    ...product,
                    statut: isDisponible ? 'disponible' : 'indisponible',
                    images,
                    userInfo,
                };
            }),
        );

        return new BaseResponse(200, 'Produits utilisateur valides avec découpage', data);
    }

    async getAllProductsAdmin(params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page, limit } = params;
        const now = new Date();

        const paginateOptions: PaginateOptions = {
            model: 'Product',
            page: Number(page),
            limit: Number(limit),
            selectAndInclude: {
                include: {
                    addedBy: true,
                    decoupage: {
                        include: {
                            district: true,
                            region: true,
                            department: true,
                            sousPrefecture: true,
                            localite: true,
                        },
                    },
                    EcommerceOrderItem: true,
                },
                select: null,
            },
            orderBy: { createdAt: 'desc' },
        };

        const data = await this.functionService.paginate(paginateOptions);

        data.data = await Promise.all(
            data.data.map(async (product) => {
                const isDisponible =
                    new Date(product.disponibleDe) <= now &&
                    new Date(product.disponibleJusqua) >= now;

                const images = await this.getProductImages(product.id);
                const userInfo = await this.getUserByCodeGenerate(product.codeUsers);

                return {
                    ...product,
                    statut: isDisponible ? 'disponible' : 'indisponible',
                    images,
                    userInfo,
                };
            }),
        );

        return new BaseResponse(200, 'Tous les produits admin avec découpage', data);
    }

    async getProducteurProductStats(code: string): Promise<BaseResponse<any>> {
        // Récupère les produits de ce code producteur (codeUsers)
        const userProducts = await this.prisma.product.findMany({
            where: {
                codeUsers: code,
            },
            select: {
                id: true,
                quantite: true,
            },
        });

        const productIds = userProducts.map((p) => p.id);

        const [productCount, totalStock, totalSold, orderCount] = await Promise.all([
            // Nombre total de produits liés au code
            this.prisma.product.count({
                where: {
                    codeUsers: code,
                },
            }),
            // Somme des quantités (champ quantite)
            this.prisma.product.aggregate({
                where: {
                    codeUsers: code,
                },
                _sum: {
                    quantite: true,
                },
            }),
            // Total des quantités vendues
            this.prisma.ecommerceOrderItem.aggregate({
                where: {
                    productId: {
                        in: productIds,
                    },
                    ecommerceOrder: {
                        status: 'COMPLETED',
                    },
                },
                _sum: {
                    quantity: true,
                },
            }),
            // Nombre de commandes contenant au moins un des produits de ce producteur
            this.prisma.ecommerceOrder.count({
                where: {
                    items: {
                        some: {
                            productId: {
                                in: productIds,
                            },
                        },
                    },
                },
            }),
        ]);

        return new BaseResponse(200, 'Statistiques des produits de l’utilisateur', {
            totalProducts: productCount,
            totalStock: totalStock._sum.quantite || 0,
            totalOrders: orderCount,
            totalSoldProducts: totalSold._sum.quantity || 0,
        });
    }

    async getGlobalProductStats(): Promise<BaseResponse<any>> {
        const [productCount, totalStock, totalSold, orderCount] = await Promise.all([
            // Nombre total de produits
            this.prisma.product.count(),

            // Somme totale des quantités disponibles
            this.prisma.product.aggregate({
                _sum: {
                    quantite: true,
                },
            }),

            // Total vendu dans les commandes complétées
            this.prisma.ecommerceOrderItem.aggregate({
                where: {
                    ecommerceOrder: {
                        status: 'COMPLETED',
                    },
                },
                _sum: {
                    quantity: true,
                },
            }),

            // Nombre total de commandes contenant au moins un item
            this.prisma.ecommerceOrder.count({
                where: {
                    items: {
                        some: {}, // au moins un produit
                    },
                },
            }),
        ]);

        return new BaseResponse(200, 'Statistiques globales des produits', {
            totalProducts: productCount,
            totalStock: totalStock._sum.quantite || 0,
            totalOrders: orderCount,
            totalSoldProducts: totalSold._sum.quantity || 0,
        });
    }








}

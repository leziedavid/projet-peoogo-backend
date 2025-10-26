import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, ForbiddenException, } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/utils/cloudinary.service';
import { CreateProductDto, UpdateProductDto } from 'src/dto/request/product.dto';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';
import { CreateDecoupageDto } from 'src/dto/request/decoupage.dto';
import { Prisma, ProductStatus, TypeCompte } from '@prisma/client';
import { FunctionService, PaginateOptions } from 'src/utils/pagination.service';
import { MarketProduitFilterDto } from 'src/dto/request/marketProduitFilter.dto';
import { subHours, subDays } from 'date-fns';
import { getPublicFileUrl } from 'src/utils/helper';
import { LocalStorageService } from 'src/utils/LocalStorageService';

@Injectable()
export class ProductService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinary: CloudinaryService,
        private readonly functionService: FunctionService,
        private readonly localStorage: LocalStorageService,
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
                // await this.cloudinary.deleteFileByPublicId(existingFile.fileCode);
                await this.localStorage.deleteFile(existingFile.fileCode);

            } catch (error) {
                console.warn(`Erreur suppression Cloudinary ${existingFile.fileCode}: ${error.message}`);
            }
            await this.prisma.fileManager.deleteMany({
                where: { targetId: productId, fileType },
            });
        }

        // Upload fichier
        // const uploadResult = await this.cloudinary.uploadFile(fileBuffer, folder);
        const uploadResult = await this.localStorage.saveFile(fileBuffer, folder);

        // Sauvegarde en DB
        await this.prisma.fileManager.create({
            data: {
                ...uploadResult,
                fileType,
                targetId: productId,
            },
        });
    }

    private parseStringOrArray<T = string>(input: unknown): T[] {
        if (Array.isArray(input)) {
            return input as T[];
        }
        if (typeof input === 'string') {
            try {
                const parsed = JSON.parse(input);
                if (Array.isArray(parsed)) {
                    return parsed as T[];
                } else {
                    console.error('Le JSON parsé n’est pas un tableau:', parsed);
                    return [];
                }
            } catch (e) {
                console.error('Erreur parsing JSON:', e instanceof Error ? e.message : e);
                return [];
            }
        }
        return [];
    }

    private async getProductImages(productId: string): Promise<string[]> {
        const files = await this.prisma.fileManager.findMany({
            where: {
                fileType: 'productFiles',
                targetId: productId,
            },
            orderBy: { createdAt: 'asc' },
        });

        // Transforme les fileUrl relatifs en URL publiques complètes
        return files.map(file => getPublicFileUrl(file.fileUrl));
    }

    private async getUserByCodeGenerate(rawCode: string): Promise<any[]> {

        const cleanCode = rawCode.replace(/\s+/g, '');
        const user = await this.prisma.user.findFirst({
            where: {
                codeGenerate: {
                    equals: cleanCode + "#",
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

    private async getUserByCodeGenerateOne(rawCode: string): Promise<any[]> {

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

    // Fonction pour récupérer un utilisateur valide selon codeGenerate et typeActeur
    private async getValidUserByCode(rawCode: string): Promise<any | null> {
        if (!rawCode || Number(rawCode) <= 0) return null;

        const allowedTypes: TypeCompte[] = [
            'AGRICULTEURS',
            'AQUACULTEURS',
            'AUTRE_ACTEURS',
            'APICULTEURS',
            'REVENDEUR',
            'TRANSFORMATEUR',
        ];

        const cleanCode = rawCode.replace(/\s+/g, '');
        // Recherche de l'utilisateur avec typeCompte autorisé
        const user = await this.prisma.user.findFirst({
            where: {
                codeGenerate: {
                    equals: cleanCode,
                    mode: 'insensitive',
                },
                typeCompte: { in: allowedTypes },
            },
            include: {
                wallet: true,
            },
        });

        if (!user) return null;

        // Recherche de l'enrôlement correspondant
        const enrollement = await this.prisma.enrollements.findFirst({
            where: {
                code: {
                    equals: cleanCode,
                    mode: 'insensitive',
                },
            },
        });

        if (!enrollement) return null;

        const fichiers = await this.getProductImages(user.id);

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            wallet: user.wallet,
            generatedCode: user.codeGenerate,
            code: enrollement.code,
            photo: fichiers[0] || null,
            typeCompte: user.typeCompte,
        };
    }

    async createProduct(dto: CreateProductDto, userId: string): Promise<BaseResponse<{ productId: string }>> {
        const decoupages = await this.findDecoupageOrFail(dto.decoupage);
        const { image, autreImage, prixUnitaire, prixEnGros, quantite, decoupage, categories, ...productData } = dto as any;

        try {
            const code = await this.generateUniqueProductCode();
            const prixUnitaireNumber = parseFloat(prixUnitaire);
            const prixEnGrosNumber = parseFloat(prixEnGros);
            const quantiteNumber = parseInt(quantite, 10);

            // Étape 1 : Création du produit sans image
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
            };

            if ('decoupage' in dataToSave) delete dataToSave.decoupage;

            const product = await this.prisma.product.create({ data: dataToSave });
            // Étape 2 : Gestion des catégories
            const categoriesSelecte = this.parseStringOrArray<string>(dto.categories);
            if (categoriesSelecte.length > 0) {
                await this.prisma.product.update({
                    where: { id: product.id },
                    data: {
                        categories: {
                            connect: categoriesSelecte.map((categorieId) => ({ id: categorieId })),
                        },
                    },
                });
            }


            // Étape 2 : Upload image principale (si présente)
            if (image) {
                // const uploadResult = await this.cloudinary.uploadFile(image.buffer, 'products');
                const uploadResult = await this.localStorage.saveFile(image.buffer, 'products');
                await this.prisma.product.update({
                    where: { id: product.id },
                    data: { imageUrl: uploadResult.fileUrl },
                });
            }

            // Étape 3 : Upload autres images
            if (autreImage && autreImage.length > 0) {
                for (const file of autreImage) {

                    await this.uploadAndSaveSingleFile(product.id, file.buffer, 'productFiles', 'products');
                }
            }

            // return new BaseResponse(201, 'Produit créé avec succès',{ productId:"1" });
            return new BaseResponse(201, 'Produit créé avec succès', { productId: product.id });

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

        const { image, autreImage, prixUnitaire, prixEnGros, quantite, decoupage, categories, ...productData } = dto as any;

        let decoupageId = existing.decoupageId;
        if (decoupage) {
            const decoupages = await this.findDecoupageOrFail(decoupage);
            decoupageId = decoupages.id;
        }

        // Préparation des données à mettre à jour (sans imageUrl)
        const dataToUpdate: any = {
            ...productData,
            decoupageId,
            nom: dto.nom ?? existing.nom,
            description: dto.description ?? existing.description,
            saleType: dto.saleType ?? existing.saleType,
            paymentMethod: dto.paymentMethod ?? existing.paymentMethod,
            disponibleDe: dto.disponibleDe ? new Date(dto.disponibleDe) : existing.disponibleDe,
            disponibleJusqua: dto.disponibleJusqua ? new Date(dto.disponibleJusqua) : existing.disponibleJusqua,
            unite: dto.unite ?? existing.unite,
            prixUnitaire: prixUnitaire ? parseFloat(prixUnitaire) : existing.prixUnitaire,
            prixEnGros: prixEnGros ? parseFloat(prixEnGros) : existing.prixEnGros,
            quantite: quantite ? parseInt(quantite, 10) : existing.quantite,
            typeActeur: dto.typeActeur ?? existing.typeActeur,
            updatedAt: new Date(),
            codeUsers: dto.codeUsers ?? existing.codeUsers,
        };

        // Nettoyage
        delete dataToUpdate.decoupage;

        // Mise à jour du produit sans imageUrl
        await this.prisma.product.update({
            where: { id },
            data: dataToUpdate,
        });

        // Mise à jour des catégories
        const categoriesSelecte = this.parseStringOrArray<string>(categories);

        if (categoriesSelecte.length > 0) {
            await this.prisma.product.update({
                where: { id },
                data: {
                    categories: {
                        set: [], // on vide les anciennes catégories
                        connect: categoriesSelecte.map((categorieId) => ({ id: categorieId })),
                    },
                },
            });
        }

        const fileType = 'productFiles';

        // Si nouvelle image principale envoyée, on supprime l’ancienne puis on upload la nouvelle
        if (image) {
            // Trouver l’ancienne image principale liée au produit
            const existingFile = await this.prisma.fileManager.findFirst({
                where: { targetId: id, fileType },
                orderBy: { createdAt: 'desc' },
            });

            if (existingFile?.fileCode) {
                try {

                    // await this.cloudinary.deleteFileByPublicId(existingFile.fileCode);
                    await this.localStorage.deleteFile(existingFile.fileCode);

                } catch (error) {
                    console.warn(`Erreur suppression Cloudinary ${existingFile.fileCode}: ${error.message}`);
                }
                // Supprimer les anciens fichiers liés (images principales)
                await this.prisma.fileManager.deleteMany({
                    where: { targetId: id, fileType },
                });
            }

            // Upload nouvelle image principale
            // const uploadResult = await this.cloudinary.uploadFile(image.buffer, 'products');
            const uploadResult = await this.localStorage.saveFile(image.buffer, 'products');
            const imageUrl = uploadResult.fileUrl;

            // Mise à jour du produit avec la nouvelle image principale
            await this.prisma.product.update({
                where: { id },
                data: { imageUrl },
            });

            // Sauvegarde du fichier uploadé en base
            await this.uploadAndSaveSingleFile(id, image, fileType, 'products');
        }

        // Pour les autres images, on ajoute sans supprimer les existantes
        if (autreImage && autreImage.length > 0) {
            for (const file of autreImage) {
                await this.uploadAndSaveSingleFile(id, file.buffer, fileType, 'products');
            }
        }

        return new BaseResponse(200, 'Produit mis à jour avec succès', null);
    }

    // ✅ Mettre à jour la période de disponibilité
    async updateAvailability(id: string, disponibleDe: string, disponibleJusqua: string): Promise<BaseResponse<{ productId: string }>> {
        const product = await this.prisma.product.findUnique({ where: { id } });
        if (!product) throw new NotFoundException('Produit non trouvé');

        const updated = await this.prisma.product.update({
            where: { id },
            data: {
                disponibleDe: new Date(disponibleDe),
                disponibleJusqua: new Date(disponibleJusqua),
            },
        });

        return new BaseResponse(
            200,
            'Période de disponibilité mise à jour avec succès',
            { productId: updated.id }
        );
    }

    // ✅ Mettre à jour la quantité
    async updateQuantity(id: string, quantite: number): Promise<BaseResponse<{ productId: string }>> {
        const product = await this.prisma.product.findUnique({ where: { id } });
        if (!product) throw new NotFoundException('Produit non trouvé');

        const updated = await this.prisma.product.update({
            where: { id },
            data: { quantite },
        });

        return new BaseResponse(
            200,
            'Quantité mise à jour avec succès',
            { productId: updated.id }
        );
    }

    // ✅ Mettre à jour le statut d’un produit
    async updateProductStatus( id: string,  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' ): Promise<BaseResponse<{ productId: string; newStatus: string }>> {
        // Vérifier si le produit existe
        const product = await this.prisma.product.findUnique({ where: { id } });
        if (!product) throw new NotFoundException('Produit non trouvé');

        // Mettre à jour le statut
        const updated = await this.prisma.product.update({
            where: { id },
            data: { status },
        });

        return new BaseResponse(  200, 'Statut du produit mis à jour avec succès',
            {
                productId: updated.id,
                newStatus: updated.status,
            }
        );
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
                categories: true,
            },
        });

        if (!product) throw new NotFoundException('Produit introuvable');

        return new BaseResponse(200, 'Détail du produit', product);
    }

    async deleteProduct(id: string, userId: string): Promise<BaseResponse<null>> {

        const product = await this.prisma.product.findUnique({ where: { id } });

        if (!product) {
            throw new NotFoundException('Produit introuvable');
        }

        // Étape 1 : Supprimer les fichiers associés au produit dans Cloudinary et en DB
        const files = await this.prisma.fileManager.findMany({
            where: { targetId: id },
        });

        for (const file of files) {
            try {
                if (file.fileCode) {
                    // await this.cloudinary.deleteFileByPublicId(file.fileCode);
                    await this.localStorage.deleteFile(file.fileCode);
                }
            } catch (error) {
                console.warn(`Erreur suppression fichier ${file.fileCode} : ${error.message}`);
            }
        }

        // Supprimer les entrées dans fileManager
        await this.prisma.fileManager.deleteMany({
            where: { targetId: id },
        });

        // Étape 2 : Supprimer l'image principale du produit (imageUrl)
        if (product.imageUrl) {
            try {
                // Extraire le `public_id` à partir de l'URL
                const regex = /\/([^\/]+)\.[a-z]+$/;
                const match = product.imageUrl.match(regex);
                const publicId = match ? match[1] : null;

                if (publicId) {
                    await this.cloudinary.deleteFileByPublicId(publicId);
                }
            } catch (error) {
                console.warn(`Erreur suppression image principale : ${error.message}`);
            }
        }

        // Étape 3 : Supprimer le produit
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
                    categories: true,
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
                // Transforme l'image principale du produit
                const mainImageUrl = product.imageUrl ? getPublicFileUrl(product.imageUrl) : null;

                return {
                    ...product,
                    statut: isDisponible ? 'disponible' : 'indisponible',
                    imageUrl: mainImageUrl, // image principale transformée
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
                    categories: true,
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
                const userInfo = await this.getUserByCodeGenerateOne(product.codeUsers);
                const mainImageUrl = product.imageUrl ? getPublicFileUrl(product.imageUrl) : null;
                return {
                    ...product,
                    statut: isDisponible ? 'disponible' : 'indisponible',
                    imageUrl: mainImageUrl, // image principale transformée
                    images,
                    userInfo,
                };
            }),
        );

        return new BaseResponse(200, 'Liste paginée des produits disponibles', data);
    }

    async getAllProductsWithStatus(params: PaginationParamsDto, categorieFilter?: string,): Promise<BaseResponse<any>> {
        const { page = 1, limit = 10 } = params;
        const now = new Date();
        // Filtres initiaux
        const filters: Prisma.ProductWhereInput = {
            status: ProductStatus.ACTIVE,
        };

        // Filtre par catégorie si fourni
        if (categorieFilter && categorieFilter.trim() !== '') {
            filters.categories = {
                some: {
                    id: {
                        contains: categorieFilter.trim(),
                        mode: 'insensitive',
                    },
                },
            };
        }

        const paginateOptions: PaginateOptions = {
            model: 'Product',
            page: Number(page),
            limit: Number(limit),
            conditions: filters, // ⚡️ ajoute les filtres ici
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
                    categories: true, // inclure les catégories pour info
                },
            },
            orderBy: { disponibleDe: 'desc' },
        };

        const data = await this.functionService.paginate(paginateOptions);

        // Ajoute le statut et les images à chaque produit
        data.data = await Promise.all(
            data.data.map(async (product) => {
                const isDisponible =
                    new Date(product.disponibleDe) <= now &&
                    new Date(product.disponibleJusqua) >= now;

                const images = await this.getProductImages(product.id);
                const userInfo = await this.getUserByCodeGenerateOne(product.codeUsers);
                const mainImageUrl = product.imageUrl ? getPublicFileUrl(product.imageUrl) : null;

                return {
                    ...product,
                    statut: isDisponible ? 'disponible' : 'indisponible',
                    imageUrl: mainImageUrl,
                    images,
                    userInfo: userInfo || null,
                };
            }),
        );

        return new BaseResponse(
            200,
            'Tous les produits avec leur statut, images et catégories',
            data,
        );
    }

    async filterProductsWithStatus(dto: MarketProduitFilterDto, params: PaginationParamsDto,): Promise<BaseResponse<any>> {
        const { page = 1, limit = 10 } = params;
        const now = new Date();

        // 🎯 Filtre initial actif uniquement sur les produits actifs
        const filters: Prisma.ProductWhereInput = {
            status: ProductStatus.ACTIVE,
        };

        // 1. CATEGORIE
        if (dto.categorie && dto.categorie.trim() !== '') {
            filters.categories = {
                some: {
                    id: {
                        contains: dto.categorie.trim(),
                        mode: 'insensitive',
                    },
                },
            };
        }

        //2. SPECULATION
        if (dto.speculation && dto.speculation.trim() !== '') {
            filters.nom = {
                contains: dto.speculation.trim(),
                mode: 'insensitive',
            };
        }

        // 2. TYPE DE VENTE
        if (dto.typeVente && dto.typeVente.trim() !== '') {
            filters.saleType = dto.typeVente.trim();
        }

        // 3. PRIX
        if ((typeof dto.prixMin === 'number' && dto.prixMin > 0) || (typeof dto.prixMax === 'number' && dto.prixMax > 0)) {
            filters.prixUnitaire = {};
            if (dto.prixMin > 0) filters.prixUnitaire.gte = dto.prixMin;
            if (dto.prixMax > 0) filters.prixUnitaire.lte = dto.prixMax;
        }

        // 4. QUANTITE
        if ((typeof dto.qteMin === 'number' && dto.qteMin > 0) || (typeof dto.qteMax === 'number' && dto.qteMax > 0)) {
            filters.quantite = {};
            if (dto.qteMin > 0) filters.quantite.gte = dto.qteMin;
            if (dto.qteMax > 0) filters.quantite.lte = dto.qteMax;
        }

        // 5. PERIODE
        if (dto.periode && dto.periode.trim() !== '') {
            let dateLimit: Date | null = null;
            switch (dto.periode) {
                case '24h':
                    dateLimit = subHours(now, 24);
                    break;
                case '7j':
                    dateLimit = subDays(now, 7);
                    break;
                case '30j':
                    dateLimit = subDays(now, 30);
                    break;
            }
            if (dateLimit) {
                filters.createdAt = { gte: dateLimit };
            }
        }

        // 6. DECOUPAGE (si au moins un ID est présent et non vide)
        const hasDecoupage =
            dto.decoupage &&
            Object.values(dto.decoupage).some((val) => typeof val === 'string' && val.trim() !== '');

        if (hasDecoupage) {
            const decoupage = await this.prisma.decoupage.findFirst({
                where: {
                    districtId: dto.decoupage.districtId?.trim() || undefined,
                    regionId: dto.decoupage.regionId?.trim() || undefined,
                    departmentId: dto.decoupage.departmentId?.trim() || undefined,
                    sousPrefectureId: dto.decoupage.sousPrefectureId?.trim() || undefined,
                    localiteId: dto.decoupage.localiteId?.trim() || undefined,
                },
            });

            if (decoupage) {
                filters.decoupageId = decoupage.id;
            } else {
                // Aucun découpage correspondant → aucun produit
                return new BaseResponse(200, 'Aucun produit trouvé', {
                    data: [],
                    meta: { total: 0, page, limit },
                });
            }
        }

        // 7. Pagination avec filtres stricts
        const paginateOptions: PaginateOptions = {
            model: 'Product',
            page: Number(page),
            limit: Number(limit),
            conditions: filters,
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
                    categories: true,
                },
            },
            orderBy: { disponibleDe: 'desc' },
        };

        const data = await this.functionService.paginate(paginateOptions);

        // 8. Ajouter statut, images, user info
        data.data = await Promise.all(
            data.data.map(async (product) => {
                const isDisponible = new Date(product.disponibleDe) <= now && new Date(product.disponibleJusqua) >= now;
                const images = await this.getProductImages(product.id);
                const userInfo = await this.getUserByCodeGenerateOne(product.codeUsers);
                const mainImageUrl = product.imageUrl ? getPublicFileUrl(product.imageUrl) : null;
                return {
                    ...product,
                    statut: isDisponible ? 'disponible' : 'indisponible',
                    imageUrl: mainImageUrl, // image principale transformée
                    images,
                    userInfo,
                };
            }),
        );

        return new BaseResponse(200, 'Produits filtrés avec succès', data);
    }

    async geProduitstById(id: string): Promise<BaseResponse<any>> {
        try {
            const now = new Date();

            // Récupération du produit avec ses relations
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
                    categories: true,
                },
            });

            if (!product) {
                return new BaseResponse(404, 'Produit non trouvé', null);
            }

            // Calcul du statut (disponible / indisponible)
            const isDisponible =
                new Date(product.disponibleDe) <= now &&
                new Date(product.disponibleJusqua) >= now;

            // Récupération des images
            const images = await this.getProductImages(product.id);
            const mainImageUrl = product.imageUrl ? getPublicFileUrl(product.imageUrl) : null;
            // Récupération des infos utilisateur
            const userInfo = await this.getUserByCodeGenerateOne(product.codeUsers);

            // Assemblage final
            const fullProduct = {
                ...product,
                statut: isDisponible ? 'disponible' : 'indisponible',
                imageUrl: mainImageUrl, // image principale transformée
                images,
                userInfo,
            };

            return new BaseResponse(200, 'Détail du produit récupéré avec succès', fullProduct);
        } catch (error) {
            console.error('Erreur dans getById:', error);
            throw new InternalServerErrorException("Erreur lors de la récupération du produit");
        }
    }

    async getProducteurProductsByCode(code: string, params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page, limit } = params;
        const now = new Date();

        const paginateOptions: PaginateOptions = {
            model: 'Product',
            page: Number(page),
            limit: Number(limit),
            conditions: {
                codeUsers: code + "#", // filtre correct basé sur ton modèle
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
                    categories: true,
                },
            },
            orderBy: { createdAt: 'desc' }
        };

        const data = await this.functionService.paginate(paginateOptions);
        // Ajoute le statut et les images à chaque produit

        data.data = await Promise.all(
            data.data.map(async (product) => {
                const isDisponible = new Date(product.disponibleDe) <= now && new Date(product.disponibleJusqua) >= now;
                const allimages = await this.getProductImages(product.id);
                const userInfo = await this.getValidUserByCode(product.codeUsers);
                const mainImageUrl = product.imageUrl ? getPublicFileUrl(product.imageUrl) : null;

                return {
                    ...product,
                    statut: isDisponible ? 'disponible' : 'indisponible',
                    imageUrl: mainImageUrl, // image principale transformée
                    allimages,
                    userInfo,
                };
            }),
        );

        return new BaseResponse(200, 'Produits utilisateur valides avec découpage', data);
    }

    async getAllProductsAdmin(params: PaginationParamsDto, categorie?: string, search?: string,): Promise<BaseResponse<any>> {
        const { page, limit } = params;
        const now = new Date();
        const filters: Prisma.ProductWhereInput = {};
        // Filtre catégorie si fourni
        if (categorie && categorie.trim() !== '') {
            filters.categories = {
                some: {
                    id: {
                        contains: categorie.trim(),
                        mode: 'insensitive',
                    },
                },
            };
        }

        // Filtre recherche sur le nom du produit si fourni
        if (search && search.trim() !== '') {
            filters.nom = {
                contains: search.trim(),
                mode: 'insensitive',
            };
        }

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
                    categories: true,
                },
                select: null,
            },
            conditions: filters,
            orderBy: { createdAt: 'desc' },
        };

        const data = await this.functionService.paginate(paginateOptions);

        data.data = await Promise.all(
            data.data.map(async (product) => {
                if (!product.codeUsers || Number(product.codeUsers) <= 0) return null;

                const userInfo = await this.getValidUserByCode(product.codeUsers);
                if (!userInfo) return null;

                const isDisponible =
                    new Date(product.disponibleDe) <= now &&
                    new Date(product.disponibleJusqua) >= now;

                const images = await this.getProductImages(product.id);
                const mainImageUrl = product.imageUrl ? getPublicFileUrl(product.imageUrl) : null;

                return {
                    ...product,
                    statut: isDisponible ? 'disponible' : 'indisponible',
                    imageUrl: mainImageUrl,
                    images,
                    userInfo,
                };
            }),
        );

        data.data = data.data.filter((p) => p !== null);

        return new BaseResponse(200, 'Tous les produits admin avec découpage et filtres', data);
    }


    async getAllProductsAdmin1(params: PaginationParamsDto): Promise<BaseResponse<any>> {
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
                codeUsers: code + "#",
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
                    codeUsers: code + "#",
                },
            }),
            // Somme des quantités (champ quantite)
            this.prisma.product.aggregate({
                where: {
                    codeUsers: code + "#",
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

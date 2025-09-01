import { Injectable, UnauthorizedException, NotFoundException, InternalServerErrorException, } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { CloudinaryService } from 'src/utils/cloudinary.service';
import { UserStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { BaseResponse } from 'src/dto/request/base-response.dto';
import { RegisterDto } from 'src/dto/request/register.dto';
import { LoginDto } from 'src/dto/request/login.dto';
import { UpdateUserDto } from 'src/dto/request/updateUser.dto';
import { ChangePasswordDto } from 'src/dto/request/change-password.dto';
import { plainToInstance } from 'class-transformer';
import { UserResponseDataDto, FileManagerDto, WalletDto, TransactionDto, VehicleDto, TripDto, StopPointDto, OrderDto, ServiceOrderDto, MenuItemDto, ServiceWithMenusDto } from 'src/dto/response/user-responseData.dto'; // adapte l'import
import * as jwt from 'jsonwebtoken';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';
import { FunctionService } from 'src/utils/pagination.service';
import { FilesUpdateDto } from 'src/dto/request/filesUpdatedto';
import { UpdateProfileDto } from 'src/dto/request/update-profile.dto';
import { LoginWithCodeDto } from 'src/dto/request/login-code.dto';
import { LoginWithPhoneDto } from 'src/dto/request/login-phone.dto';
import { FilterUserDto } from 'src/dto/request/filter-user.dto';
import { LoginByPhoneCode } from 'src/dto/request/loginByPhoneCode.dto';
import { LocalStorageService } from 'src/utils/LocalStorageService';
import * as path from 'path';
import { getPublicFileUrl } from 'src/utils/helper';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly cloudinary: CloudinaryService,
        private readonly functionService: FunctionService,
        private readonly localStorage: LocalStorageService, // injecter ton service
        private readonly configService: ConfigService,  // <-- Injection ici

    ) { }

    private generateAccountNumber(): string {
        return `NR ${Math.floor(Math.random() * 1000000000000)}`; // Exemple de génération de numéro unique
    }

    private generateCodes(): string {
        const randomNumber = Math.floor(1000 + Math.random() * 9000); // Nombre aléatoire entre 1000 et 9999
        return `PEO${randomNumber}#`;
    }
    /** Enregistrement d’un nouvel utilisateur CloudinaryService */
    async register2(dto: RegisterDto): Promise<BaseResponse<{ userId: string }>> {

        const accountNumberGenearate = this.generateAccountNumber();
        const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (exists) throw new UnauthorizedException('Email déjà utilisé');

        const hashed = await bcrypt.hash(dto.password, 10);
        const passwordGenerat: string | null = dto.password ? dto.password : null;

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                name: dto.name,
                // phoneCountryCode: dto.phoneCountryCode,
                phoneNumber: dto.phoneNumber,
                password: hashed,
                passwordGenerate: passwordGenerat,
                role: dto.role,
                status: UserStatus.ACTIVE,
                typeCompte: dto.typeCompte,
                wallet: { create: { balance: 0, accountNumber: accountNumberGenearate } },
            },
        });

        if (dto.file) {
            try {
                const upload = await this.cloudinary.uploadFile(dto.file.buffer, 'users');

                await this.prisma.fileManager.create({
                    data: {
                        ...upload,
                        fileType: 'userFiles',
                        targetId: user.id,
                    },
                });
            } catch (err) {
                throw new InternalServerErrorException('Erreur lors de l’upload de l’image');
            }
        }

        return new BaseResponse(201, 'Utilisateur créé', { userId: user.id });
    }

    /** Enregistrement d’un nouvel utilisateur */
    async register(dto: RegisterDto): Promise<BaseResponse<{ userId: string }>> {
        const accountNumberGenearate = this.generateAccountNumber();

        const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (exists) throw new UnauthorizedException('Email déjà utilisé');

        const hashed = await bcrypt.hash(dto.password, 10);
        const passwordGenerat: string | null = dto.password ? dto.password : null;
        let codeUser: string | null = null;

        if (dto.role === "AGENT_ENROLEUR") {
            codeUser = this.generateCodes();
        }

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                name: dto.name,
                phoneNumber: dto.phoneNumber,
                password: hashed,
                passwordGenerate: passwordGenerat,
                codeGenerate: codeUser,
                role: dto.role,
                status: UserStatus.ACTIVE,
                typeCompte: dto.typeCompte,
                wallet: { create: { balance: 0, accountNumber: accountNumberGenearate } },
            },
        });

        // Si un fichier est fourni, le sauvegarder localement
        if (dto.file) {
            try {
                const upload = await this.localStorage.saveFile(dto.file.buffer, 'users');

                await this.prisma.fileManager.create({
                    data: {
                        ...upload,
                        fileType: 'userFiles',
                        targetId: user.id,
                    },
                });
            } catch (err) {
                console.log(err);
                throw new InternalServerErrorException('Erreur lors de l’upload de l’image');
            }
        }

        return new BaseResponse(201, 'Utilisateur créé', { userId: user.id });
    }


    private async uploadAndSaveSingleFile(enrollementId: string, fileBuffer: Buffer | string, fileType: string, folder: string,): Promise<void> {
        // Chercher fichier existant et supprimer
        const existingFile = await this.prisma.fileManager.findFirst({
            where: { targetId: enrollementId, fileType },
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
                where: { targetId: enrollementId, fileType },
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
                targetId: enrollementId,
            },
        });
    }

    /** Mise à jour du profil utilisateur */
    async updateUser(id: string, dto: UpdateUserDto): Promise<BaseResponse<{ user: any }>> {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('Utilisateur introuvable');

        const data: any = {};
        if (dto.name) data.name = dto.name;
        if (dto.password) data.password = await bcrypt.hash(dto.password, 10);
        if (dto.role) data.role = dto.role;
        if (dto.status) data.status = dto.status;
        if (dto.typeCompte) data.typeCompte = dto.typeCompte;
        if (dto.phoneCountryCode) data.phoneCountryCode = dto.phoneCountryCode;
        if (dto.phoneNumber) data.phoneNumber = dto.phoneNumber;
        if (dto.email) data.email = dto.email;

        const updated = await this.prisma.user.update({ where: { id }, data });

        // 📎 Mise à jour des fichiers
        try {
            if (dto.file) {
                // await handleFileUpdate(dto.file.buffer, 'userFiles');
                await this.uploadAndSaveSingleFile(id, dto.file.buffer, 'userFiles', 'users');
            }
        } catch (err) {
            throw new InternalServerErrorException("Erreur lors de la mise à jour d’un fichier utilisateur");
        }

        return new BaseResponse(200, 'Profil mis à jour', { user: updated });
    }

    /** Connexion utilisateur + génération tokens */
    async login(dto: LoginDto): Promise<BaseResponse<{ access_token: string; refresh_token: string; user: any }>> {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) throw new UnauthorizedException('Utilisateur non trouvé');

        const ok = await bcrypt.compare(dto.password, user.password);
        if (!ok) throw new UnauthorizedException('Mot de passe incorrect');
        if (user.status === UserStatus.INACTIVE) throw new UnauthorizedException('Compte inactif');
        if (user.status === UserStatus.BLOCKED) throw new UnauthorizedException('Compte bloqué');

        // 🔍 Récupération de l'image liée à l'utilisateur
        const file = await this.prisma.fileManager.findFirst({
            where: { targetId: user.id, fileType: 'userFiles', },
            orderBy: { createdAt: 'desc' }, // au cas où plusieurs images
        });

        // findwallet
        const wallet = await this.prisma.wallet.findUnique({ where: { userId: user.id } });
        // const imageUrl = file?.fileUrl || null;
        // Transforme le fileUrl relatif en URL publique
        const imageUrl = file ? getPublicFileUrl(file.fileUrl) : null;

        const payload = { sub: user.id, role: user.role, status: user.status, name: user.name, imageUrl, wallet: wallet.balance, compte: wallet.accountNumber, typeCompte: user.typeCompte };
        const access = this.jwtService.sign(payload, { expiresIn: '15m' });
        const refresh = this.jwtService.sign(payload, { expiresIn: '7d' });

        return new BaseResponse(200, 'Connexion réussie', {
            access_token: access,
            refresh_token: refresh,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                status: user.status,
                typeCompte: user.typeCompte,
                imageUrl
            },
        });
    }

    async loginByPhoneCode(
        dto: LoginByPhoneCode
    ): Promise<BaseResponse<{ access_token: string; refresh_token: string; user: any }>> {
        const isCode = /[a-zA-Z#]/.test(dto.login);

        const user = isCode
            ? await this.prisma.user.findFirst({ where: { codeGenerate: dto.login } })
            : await this.prisma.user.findUnique({ where: { phoneNumber: dto.login } });

        if (!user) {
            return new BaseResponse(401, 'Utilisateur non trouvé');
        }

        const ok = await bcrypt.compare(dto.password, user.password);
        if (!ok) {
            return new BaseResponse(401, 'Mot de passe incorrect');
        }

        if (user.status === UserStatus.INACTIVE) {
            return new BaseResponse(401, 'Compte inactif');
        }

        if (user.status === UserStatus.BLOCKED) {
            return new BaseResponse(401, 'Compte bloqué');
        }

        const file = await this.prisma.fileManager.findFirst({
            where: { targetId: user.id, fileType: 'userFiles' },
            orderBy: { createdAt: 'desc' },
        });

        const wallet = await this.prisma.wallet.findUnique({ where: { userId: user.id } });
        const imageUrl = file ? getPublicFileUrl(file.fileUrl) : null;

        const payload = {
            sub: user.id,
            role: user.role,
            status: user.status,
            name: user.name,
            imageUrl,
            wallet: wallet?.balance ?? 0,
            compte: wallet?.accountNumber ?? null,
            typeCompte: user.typeCompte,
        };


        const access = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('JWT_ACCESS_EXPIRE') || '15m',
        });

        const refresh = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRE') || '7d',
        });

        // const access = this.jwtService.sign(payload, { expiresIn: '15m' });
        // const refresh = this.jwtService.sign(payload, { expiresIn: '7d' });

        return new BaseResponse(200, 'Connexion réussie', {
            access_token: access,
            refresh_token: refresh,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                status: user.status,
                typeCompte: user.typeCompte,
                imageUrl,
            },
        });
    }

    /** Rafraîchir access token */
    async refreshToken(token: string): Promise<BaseResponse<{ access_token: string }>> {
        try {
            // Vérifie le refresh token (avec la clé et options par défaut)
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get<string>('JWT_SECRET'),
            });
            // Génère un nouveau access token avec la durée JWT_ACCESS_EXPIRE
            const newAccessToken = this.jwtService.sign(
                {
                    sub: payload.sub,
                    role: payload.role,
                    status: payload.status,
                    name: payload.name,
                    imageUrl: payload.imageUrl,
                    wallet: payload.wallet,
                    compte: payload.compte,
                    typeCompte: payload.typeCompte,
                },
                {
                    expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRE') || '1d',
                },
            );
            return new BaseResponse(200, 'Token rafraîchi', { access_token: newAccessToken });
        } catch (err) {
            throw new UnauthorizedException('Refresh token invalide ou expiré');
        }
    }

    /**
   * Valide ou met à jour le statut du compte utilisateur
   * @param id ID de l'utilisateur
   * @param status Nouveau statut (UserStatus enum)
   */
    async validateCompte(id: string, status: UserStatus): Promise<BaseResponse<null>> {
        const user = await this.prisma.user.findUnique({ where: { id } });

        if (!user) {
            throw new NotFoundException('Utilisateur introuvable');
        }

        await this.prisma.user.update({
            where: { id },
            data: { status },
        });

        return new BaseResponse(200, `Compte mis à jour au statut ${status}`, null);
    }

    async deleteUser(id: string): Promise<BaseResponse<null>> {
        // Vérifie que l'utilisateur existe
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('Utilisateur introuvable');

        // Supprime les fichiers liés à l'utilisateur
        const files = await this.prisma.fileManager.findMany({
            where: { fileType: 'userFiles', targetId: id },
        });

        if (files.length) {
            for (const file of files) {
                try {
                    // await this.cloudinary.deleteFileByPublicId(file.fileCode);
                    await this.localStorage.deleteFile(file.fileCode);
                } catch (err) {
                    console.warn(`Erreur suppression Cloudinary du fichier ${file.fileCode}`);
                }
            }

            await this.prisma.fileManager.deleteMany({
                where: { fileType: 'userFiles', targetId: id },
            });
        }

        // Supprime ou dissocie les wallets liés
        await this.prisma.wallet.deleteMany({
            where: { userId: id },
        });

        // Supprime l'utilisateur
        await this.prisma.user.delete({ where: { id } });

        return new BaseResponse(200, 'Utilisateur supprimé', null);
    }

    /** Changement de mot de passe */
    async changePassword(dto: ChangePasswordDto): Promise<BaseResponse<null>> {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) throw new NotFoundException('Utilisateur non trouvé');

        const valid = await bcrypt.compare(dto.oldPassword, user.password);
        if (!valid) throw new UnauthorizedException('Ancien mot de passe incorrect');

        const hashed = await bcrypt.hash(dto.newPassword, 10);
        await this.prisma.user.update({
            where: { email: dto.email },
            data: { password: hashed },
        });

        return new BaseResponse(200, 'Mot de passe changé avec succès', null);
    }

    async mapUserToResponse(user: any): Promise<BaseResponse<UserResponseDataDto>> {
        // Récupération de l'image de profil utilisateur
        const profileImage = await this.prisma.fileManager.findFirst({
            where: { targetId: user.id, fileType: 'userFiles' },
            orderBy: { createdAt: 'desc' },
        });

        // Fonction utilitaire pour récupérer les fichiers d'un véhicule
        const getVehicleFiles = async (vehicleId: string): Promise<FileManagerDto[]> => {
            const vehicleFiles = await this.prisma.fileManager.findMany({
                where: { targetId: vehicleId, fileType: 'vehicleFiles' },
                orderBy: { createdAt: 'desc' },
            });
            return vehicleFiles.map(file => plainToInstance(FileManagerDto, file));
        };

        // Pour chaque véhiculeOwned, on récupère les fichiers associés
        const vehiclesOwnedWithFiles = await Promise.all(
            (user.vehiclesOwned ?? []).map(async (vehicle: any) => {
                const files = await getVehicleFiles(vehicle.id);
                return plainToInstance(VehicleDto, { ...vehicle, files });
            }),
        );

        // Même chose pour vehiclesDriven
        const vehiclesDrivenWithFiles = await Promise.all(
            (user.vehiclesDriven ?? []).map(async (vehicle: any) => {
                const files = await getVehicleFiles(vehicle.id);
                return plainToInstance(VehicleDto, { ...vehicle, files });
            }),
        );

        // Construction du DTO final
        const dto = plainToInstance(UserResponseDataDto, {
            ...user,
            imageUrl: profileImage?.fileUrl || null,
            wallet: user.wallet
                ? {
                    ...user.wallet,
                    transactions: (user.wallet.transactions ?? []).map(tx =>
                        plainToInstance(TransactionDto, tx),
                    ),
                }
                : null,
            vehiclesOwned: vehiclesOwnedWithFiles,
            vehiclesDriven: vehiclesDrivenWithFiles,
            trips: (user.trips ?? []).map(trip => ({
                ...trip,
                stopPoints: (trip.stopPoints ?? []).map(sp => plainToInstance(StopPointDto, sp)),
            })),
            orders: (user.orders ?? []).map(order => ({
                ...order,
                trip: {
                    ...order.trip,
                    stopPoints: (order.trip?.stopPoints ?? []).map(sp =>
                        plainToInstance(StopPointDto, sp),
                    ),
                },
            })),
            serviceOrders: (user.serviceOrders ?? []).map(so => ({
                ...so,
                menuItem: plainToInstance(MenuItemDto, so.menuItem),
            })),
            services: (user.services ?? []).map(service => ({
                ...service,
                menuItems: (service.menuItems ?? []).map(mi => plainToInstance(MenuItemDto, mi)),
            })),

            // === ✅ Nouveau ===
            partnerId: user.partnerId || null,
            partner: user.partner ? plainToInstance(UserResponseDataDto, user.partner) : null,
            drivers: (user.drivers ?? []).map(driver => plainToInstance(UserResponseDataDto, driver)),
        });

        return new BaseResponse(200, 'Données utilisateur récupérées', dto);
    }

    async ParametresuserData(userId: string): Promise<BaseResponse<any>> {
        // Étape 1 : Requête vers la table user (avec le wallet en relation)
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                wallet: true, // inclure le portefeuille lié
            },
        });

        if (!user) {
            return new BaseResponse(404, "Utilisateur introuvable", null);
        }

        // Étape 2 : Récupération de l'image de profil
        const profileImage = await this.prisma.fileManager.findFirst({
            where: { targetId: userId, fileType: 'userFiles' },
            orderBy: { createdAt: 'desc' },
        });

        const imageUrl = profileImage ? getPublicFileUrl(profileImage.fileUrl) : null;
        // Étape 3 : Construction de la réponse simplifiée
        const simplifiedUserData = {
            id: user.id,
            name: user.name,
            email: user.email,
            phoneCountryCode: user.phoneCountryCode,
            phoneNumber: user.phoneNumber,
            role: user.role,
            status: user.status,
            imageUrl: imageUrl,
            wallet: user.wallet
                ? {
                    id: user.wallet.id,
                    balance: user.wallet.balance,
                    paymentMethod: user.wallet.paymentMethod,
                    rechargeType: user.wallet.rechargeType,
                    accountNumber: user.wallet.accountNumber,
                }
                : null,
        };

        return new BaseResponse(200, 'Données utilisateur récupérées', simplifiedUserData);
    }

    async updateFiles(userId: string, dto: FilesUpdateDto) {
        if (!dto.file) return;

        // Étape 1 : Récupérer l'image existante (si elle existe)
        const existingImage = await this.prisma.fileManager.findFirst({
            where: {
                targetId: userId,
                fileType: 'userFiles',
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Étape 2 : Supprimer sur Cloudinary si l'image existe
        if (existingImage?.fileCode) {
            await this.localStorage.deleteFile(existingImage.fileCode);
            // await this.cloudinary.deleteFileByPublicId(existingImage.fileCode);
        }

        // Étape 3 : Supprimer l’entrée en base (fileManager)
        if (existingImage) {
            await this.prisma.fileManager.deleteMany({
                where: { fileType: 'userFiles', targetId: userId },
            });
        }

        // Étape 4 : Upload du nouveau fichier sur Cloudinary
        try {
            const upload = await this.localStorage.saveFile(dto.file.buffer, 'users');
            // Étape 5 : Création de la nouvelle entrée
            await this.prisma.fileManager.create({
                data: {
                    ...upload,
                    fileType: 'userFiles',
                    targetId: userId,
                },
            });

        } catch (err) {

            console.error(err);
            throw new InternalServerErrorException("Erreur lors de la mise à jour de l’image");
        }

        return new BaseResponse(200, 'Profil mis à jour avec succès', null);

    }

    async updateProfile(userId: string, dto: UpdateProfileDto) {

        const user = await this.prisma.user.findUnique({ where: { id: userId } })
        if (!user) throw new NotFoundException('Utilisateur introuvable')

        const updateData: any = {}

        if (dto.name) updateData.name = dto.name
        if (dto.email) updateData.email = dto.email
        if (dto.phoneNumber) updateData.phoneNumber = dto.phoneNumber
        if (dto.phoneCountryCode) updateData.phoneCountryCode = dto.phoneCountryCode
        if (dto.password) updateData.password = await bcrypt.hash(dto.password, 10)

        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: updateData,
        })

        return new BaseResponse(200, 'Profil mis à jour avec succès', updatedUser);
    }

    /** 🔍 Liste paginée de tous les utilisateurs avec relations */
    async getAllUsers(params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page, limit } = params;
        const data = await this.functionService.paginate({
            model: 'User',
            page: Number(page),
            limit: Number(limit),
            conditions: {},
            selectAndInclude: {
                select: null,
                include: {
                    wallet: true,
                    ecommerceOrders: true,
                    agentEnroleur: {
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
                            activitprincipale: true,
                            spculationprincipale: true,
                            autresActivites: {
                                include: { activite: true }
                            },
                            autresSpeculations: {
                                include: { speculation: true }
                            },
                        },
                    },
                    agentSuperviseur: {
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
                        },
                    },
                    agentControle: {
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
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Ajout des fichiers (image, carte, permis)
        const usersWithFiles = await Promise.all(
            data.data.map(async (user) => {
                if (user.enrollementsId) {
                    // Utilisateur enrolé → récupérer fichiers depuis Enrollements
                    const [photo, document1, document2] = await Promise.all([
                        this.prisma.fileManager.findFirst({
                            where: { targetId: user.enrollementsId, fileType: 'enrollements_photo' },
                            orderBy: { createdAt: 'desc' },
                        }),
                        this.prisma.fileManager.findFirst({
                            where: { targetId: user.enrollementsId, fileType: 'enrollements_photo_document_1' },
                            orderBy: { createdAt: 'desc' },
                        }),
                        this.prisma.fileManager.findFirst({
                            where: { targetId: user.enrollementsId, fileType: 'enrollements_photo_document_2' },
                            orderBy: { createdAt: 'desc' },
                        }),
                    ]);

                    return {
                        ...user,
                        userFiles: {
                            photo: photo ? getPublicFileUrl(photo.fileUrl) : null,
                            document1: document1 ? getPublicFileUrl(document1.fileUrl) : null,
                            document2: document2 ? getPublicFileUrl(document2.fileUrl) : null,
                        },
                    };
                } else {
                    // Utilisateur normal → juste sa photo
                    const photo = await this.prisma.fileManager.findFirst({
                        where: { targetId: user.id, fileType: 'userFiles' },
                        orderBy: { createdAt: 'desc' },
                    });

                    return {
                        ...user,
                        photo: photo ? getPublicFileUrl(photo.fileUrl) : null,
                    };
                }
            })
        );

        return new BaseResponse(200, 'Liste des utilisateurs', {
            ...data,
            data: usersWithFiles,
        });
    }

    async getAllUsersByFilters(filters: FilterUserDto, params: PaginationParamsDto): Promise<BaseResponse<any>> {
        const { page, limit } = params;
        const { modeAffichage } = filters;

        // Préparation des filtres pour enrôlements
        const enrollementWhere: any = {
            is_deleted: false,
            decoupage: {},
        };

        if (filters.districtId) enrollementWhere.decoupage.districtId = filters.districtId;
        if (filters.regionId) enrollementWhere.decoupage.regionId = filters.regionId;
        if (filters.departmentId) enrollementWhere.decoupage.departmentId = filters.departmentId;
        if (filters.sousPrefectureId) enrollementWhere.decoupage.sousPrefectureId = filters.sousPrefectureId;
        if (filters.localiteId) enrollementWhere.decoupage.localiteId = filters.localiteId;

        // Cas modeAffichage = carte (coordonnées géo) uniquement enrôlements
        if (modeAffichage === 'carte') {
            const result = await this.prisma.enrollements.findMany({
                where: enrollementWhere,
                select: { coordonneesgeo: true },
            });

            const coords = result
                .filter(r => r.coordonneesgeo && r.coordonneesgeo.includes(','))
                .map(r => {
                    const [lat, lng] = r.coordonneesgeo.split(',').map(Number);
                    return { lat, lng };
                });

            return new BaseResponse(200, 'Résultat filtré (carte)', coords);
        }

        // Cas modeAffichage = graphique (groupé par jour) uniquement enrôlements
        if (modeAffichage === 'graphique') {
            const data = await this.prisma.enrollements.groupBy({
                by: ['createdAt'],
                where: enrollementWhere,
                _count: { _all: true },
                orderBy: { createdAt: 'asc' },
            });

            const formatted = data.map(item => ({
                date: item.createdAt.toISOString().split('T')[0],
                total: item._count._all,
            }));

            return new BaseResponse(200, 'Résultat filtré (graphique)', formatted);
        }

        // Pour les autres modes (ex: tableau), on récupère les utilisateurs filtrés

        // Récupérer la liste des codes Generate d'enrôlement si filtre géographique
        let codeList: string[] | undefined;

        const hasGeoFilter = Object.values(enrollementWhere.decoupage).some(v => v !== undefined);

        if (hasGeoFilter) {
            const matchingEnrollements = await this.prisma.enrollements.findMany({
                where: enrollementWhere,
                select: { code: true },
            });

            codeList = matchingEnrollements.map(e => e.code).filter(Boolean);
        }

        // Construire les conditions where pour User
        const where: any = {};

        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.role) {
            where.role = filters.role;
        }
        if (filters.typeActeur) {
            where.typeCompte = filters.typeActeur;
        }

        // Si on a une liste de codes generate (issues d'enrôlements filtrés),
        // filtrer les users par codeGenerate, sinon ne pas filtrer sur ce champ (garder tous)
        if (codeList && codeList.length > 0) {
            where.codeGenerate = { in: codeList };
        }

        // Pagination + récupération utilisateur + relations + fichiers
        const data = await this.functionService.paginate({
            model: 'User',
            page: Number(page),
            limit: Number(limit),
            conditions: where,
            selectAndInclude: {
                select: null,
                include: {
                    wallet: true,
                    ecommerceOrders: true,
                    agentEnroleur: {
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
                            activitprincipale: true,
                            spculationprincipale: true,
                            autresActivites: { include: { activite: true } },
                            autresSpeculations: { include: { speculation: true } },
                        },
                    },
                    agentSuperviseur: true,
                    agentControle: true,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Ajout des fichiers (image, carte, permis)
        const usersWithFiles = await Promise.all(
            data.data.map(async (user) => {
                if (user.enrollementsId) {
                    // Utilisateur enrolé → récupérer fichiers depuis Enrollements
                    const [photo, document1, document2] = await Promise.all([
                        this.prisma.fileManager.findFirst({
                            where: { targetId: user.enrollementsId, fileType: 'enrollements_photo' },
                            orderBy: { createdAt: 'desc' },
                        }),
                        this.prisma.fileManager.findFirst({
                            where: { targetId: user.enrollementsId, fileType: 'enrollements_photo_document_1' },
                            orderBy: { createdAt: 'desc' },
                        }),
                        this.prisma.fileManager.findFirst({
                            where: { targetId: user.enrollementsId, fileType: 'enrollements_photo_document_2' },
                            orderBy: { createdAt: 'desc' },
                        }),
                    ]);

                    return {
                        ...user,
                        userFiles: {
                            photo: photo ? getPublicFileUrl(photo.fileUrl) : null,
                            document1: document1 ? getPublicFileUrl(document1.fileUrl) : null,
                            document2: document2 ? getPublicFileUrl(document2.fileUrl) : null,
                        },
                    };
                } else {
                    // Utilisateur normal → juste sa photo
                    const photo = await this.prisma.fileManager.findFirst({
                        where: { targetId: user.id, fileType: 'userFiles' },
                        orderBy: { createdAt: 'desc' },
                    });

                    return {
                        ...user,
                        photo: photo ? getPublicFileUrl(photo.fileUrl) : null,
                    };
                }
            })
        );

        return new BaseResponse(200, 'Liste des utilisateurs filtrés', {
            ...data,
            data: usersWithFiles,
        });
    }

    async loginWithCode(dto: LoginWithCodeDto): Promise<BaseResponse<any>> {

        const user = await this.prisma.user.findFirst({
            where: { codeGenerate: dto.code }, // il faut que le champ `code` existe en BDD
        });

        if (!user) throw new UnauthorizedException('Code invalide');

        if (user.status !== UserStatus.ACTIVE)
            throw new UnauthorizedException('Compte inactif ou bloqué');

        const access_token = this.jwtService.sign({ sub: user.id, role: user.role });
        const refresh_token = this.jwtService.sign({ sub: user.id }, { expiresIn: '7d' });

        // 🔍 Récupération de l'image liée à l'utilisateur
        const file = await this.prisma.fileManager.findFirst({
            where: { targetId: user.id, fileType: 'userFiles', },
            orderBy: { createdAt: 'desc' }, // au cas où plusieurs images
        });

        // findwallet
        const wallet = await this.prisma.wallet.findUnique({ where: { userId: user.id } });
        const imageUrl = file ? getPublicFileUrl(file.fileUrl) : null;
        return new BaseResponse(200, 'Connexion réussie par code', {
            access_token,
            refresh_token,
            user: {
                id: user.id,
                name: user.name,
                code: user.codeGenerate,
                role: user.role,
                status: user.status,
                typeCompte: user.typeCompte,
                imageUrl: imageUrl,
                wallet: wallet.balance,

            },
        });
    }

    async loginWithPhone(dto: LoginWithPhoneDto): Promise<BaseResponse<any>> {
        const user = await this.prisma.user.findFirst({
            where: { phoneNumber: dto.phoneNumber },
        });

        if (!user) throw new UnauthorizedException('Utilisateur non trouvé');
        const ok = await bcrypt.compare(dto.password, user.password);
        if (!ok) throw new UnauthorizedException('Mot de passe incorrect');

        if (user.status !== UserStatus.ACTIVE)
            throw new UnauthorizedException('Compte inactif ou bloqué');

        const access_token = this.jwtService.sign({ sub: user.id, role: user.role });
        const refresh_token = this.jwtService.sign({ sub: user.id }, { expiresIn: '7d' });

        // 🔍 Récupération de l'image liée à l'utilisateur
        const file = await this.prisma.fileManager.findFirst({
            where: { targetId: user.id, fileType: 'userFiles', },
            orderBy: { createdAt: 'desc' }, // au cas où plusieurs images
        });

        // findwallet
        const wallet = await this.prisma.wallet.findUnique({ where: { userId: user.id } });
        // const imageUrl = file?.fileUrl || null;
        const imageUrl = file ? getPublicFileUrl(file.fileUrl) : null;
        return new BaseResponse(200, 'Connexion réussie', {
            access_token,
            refresh_token,
            user: {
                id: user.id,
                name: user.name,
                phoneNumber: user.phoneNumber,
                role: user.role,
                status: user.status,
                typeCompte: user.typeCompte,
                imageUrl: imageUrl,
                wallet: wallet.balance,
            },
        });
    }

    async getUserEnrollementDataByCode(rawCode: string): Promise<BaseResponse<any>> {
        const cleanCode = rawCode.replace(/\s+/g, ''); // ⚠️ Supprimer tous les espaces

        // Rechercher l'utilisateur avec un codeGenerate nettoyé
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

        if (!user) throw new NotFoundException('Utilisateur non trouvé avec ce code');

        // Rechercher l’enrollement avec un code (nettoyé)
        const enrollement = await this.prisma.enrollements.findFirst({
            where: {
                code: {
                    equals: cleanCode + "#",
                    mode: 'insensitive',
                },
            },
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
            },
        });

        if (!enrollement) throw new NotFoundException('Aucun enrôlement trouvé pour ce code');

        return new BaseResponse(200, 'information de l\'utilisateur recupérée avec succès', {
            code: enrollement.code,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                wallet: user.wallet,
                generatedCode: user.codeGenerate,
            },
            decoupage: enrollement.decoupage,
            enrollement,
        });
    }

    /** Récupère tous les utilisateurs avec le rôle AGENT_ENROLEUR */
    async getAgentsEnroleurs(): Promise<BaseResponse<any[]>> {
        try {
            const users = await this.prisma.user.findMany({
                where: { role: 'AGENT_ENROLEUR' },
                include: {
                    wallet: true,
                },
            });

            const data = users.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                status: user.status,
                wallet: user.wallet ? { balance: user.wallet.balance, accountNumber: user.wallet.accountNumber } : null,
            }));

            return new BaseResponse(200, 'Liste des agents enroleurs', data);
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    /** Récupère tous les utilisateurs avec le rôle AGENT_CONTROLE */
    async getAgentsControle(): Promise<BaseResponse<any[]>> {
        try {
            const users = await this.prisma.user.findMany({
                where: { role: 'AGENT_CONTROLE' },
                include: {
                    wallet: true
                },
            });

            const data = users.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                status: user.status,
                wallet: user.wallet ? { balance: user.wallet.balance, accountNumber: user.wallet.accountNumber } : null,
            }));

            return new BaseResponse(200, 'Liste des agents contrôle', data);
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }


}

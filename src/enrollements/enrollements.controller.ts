import { Controller, Post, Get, Patch, Delete, Body, Param, UseInterceptors, UploadedFiles, UseGuards, Query, Req, } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth, ApiQuery, } from '@nestjs/swagger';
import { EnrollementsService } from './enrollements.service';
import { CreateEnrollementsDto, UpdateEnrollementsDto, } from 'src/dto/request/enrollements.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Request } from 'express';
import { EnrollementAdminFilterDto } from 'src/dto/request/enrollementAdminFilter.dto';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';
import { ControlEnrollementDto } from 'src/dto/request/control-enrollement.dto';
import { FilterDto } from 'src/dto/request/filter.dto';

@ApiTags('Enrollements Api')
@ApiBearerAuth('access-token')
@Controller('enrollements')

export class EnrollementsController {

    constructor(private readonly enrollementsService: EnrollementsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Créer un nouvel enrollement' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([{ name: 'photo', maxCount: 1 }, { name: 'photo_document_1', maxCount: 1 }, { name: 'photo_document_2', maxCount: 1 },]),)
    @ApiResponse({ status: 201, description: 'Enrollement créé avec succès.' })
    async create(
        @UploadedFiles() files: { photo?: Express.Multer.File[]; photo_document_1?: Express.Multer.File[]; photo_document_2?: Express.Multer.File[] },
        @Body() dto: CreateEnrollementsDto, @Req() req: Request) {
        // Injecter les fichiers dans le dto en adaptant au buffer attendu
        dto.photo = files.photo?.[0] ?? null;
        dto.photo_document_1 = files.photo_document_1?.[0] ?? null;
        dto.photo_document_2 = files.photo_document_2?.[0] ?? null;
        const user = req.user as any; // typage personnalisé si disponible
        return this.enrollementsService.create(user?.userId, dto);
    }


    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour un enrollement' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([{ name: 'photo', maxCount: 1 }, { name: 'photo_document_1', maxCount: 1 }, { name: 'photo_document_2', maxCount: 1 },]),)
    @ApiResponse({ status: 200, description: 'Enrollement mis à jour.' })
    async update(@Param('id') id: string, @UploadedFiles()
    files: {
        photo?: Express.Multer.File[];
        photo_document_1?: Express.Multer.File[];
        photo_document_2?: Express.Multer.File[];
    },
        @Body() dto: UpdateEnrollementsDto, @Req() req: any,) {
        dto.photo = files.photo?.[0] ?? undefined;
        dto.photo_document_1 = files.photo_document_1?.[0] ?? undefined;
        dto.photo_document_2 = files.photo_document_2?.[0] ?? undefined;
        const user = req.user as any; // typage personnalisé si disponible

        return this.enrollementsService.update(id, dto);
    }



    @UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiOperation({ summary: 'Récupérer un enrollement par ID' })
    @ApiResponse({ status: 200, description: 'Enrollement trouvé.' })
    async findOne(@Param('id') id: string) {
        return this.enrollementsService.findOne(id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Suppression logique d’un enrollement' })
    @ApiResponse({ status: 200, description: 'Enrollement supprimé (logique).' })
    async softDelete(@Param('id') id: string) {
        return this.enrollementsService.softDelete(id);
    }

    @Delete('hard/:id')
    @ApiOperation({ summary: 'Suppression définitive d’un enrollement' })
    @ApiResponse({ status: 200, description: 'Enrollement supprimé définitivement.' })
    async hardDelete(@Param('id') id: string) {
        return this.enrollementsService.hardDelete(id);
    }

    @Get()
    @ApiOperation({ summary: 'Liste de tous les enrollements' })
    @ApiResponse({ status: 200, description: 'Liste des enrollements.' })
    async findAll() {
        return this.enrollementsService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Get('paginate/liste/all')
    @ApiOperation({ summary: 'Liste paginée de tous les enrôlements' })
    @ApiResponse({ status: 200, description: 'Liste des enrôlements paginées.' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    async getAllPaginate(@Req() req: Request, @Query() pagination: PaginationParamsDto) {
        const user = req.user as any;
        return this.enrollementsService.assignLotIfNeeded(user.userId,pagination);
    }

    @UseGuards(JwtAuthGuard)
    @Get('liest/enrollement/paginate/by-agent')
    @ApiOperation({ summary: 'Liste paginée des enrôlements par agent' })
    @ApiResponse({ status: 200, description: 'Liste des enrôlements paginées par agent.' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    async getByAgent(@Req() req: Request, @Query() pagination: PaginationParamsDto) {
        const user = req.user as any;
        return this.enrollementsService.getPaginatedByAgent(user.userId,pagination);
    }

    @UseGuards(JwtAuthGuard)
    @Get('paginates/listes/one/paginate-all')
    @ApiOperation({ summary: 'Liste paginée de tous les enrôlements' })
    @ApiResponse({ status: 200, description: 'Liste des enrôlements paginées.' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    async getAllPaginateOne(@Req() req: Request, @Query() pagination: PaginationParamsDto) {
        const user = req.user as any;
        return this.enrollementsService.getAllPaginateOne(user.userId,pagination);
    }

    // getStatistiquesControle
    @UseGuards(JwtAuthGuard)
    @Get('stats/controle')
    @ApiOperation({ summary: 'Récupération des statistiques de contrôle' })
    @ApiResponse({ status: 200, description: 'Statistiques de contrôle.' })
    @ApiQuery({ name: 'numero_lot', required: false, description: 'Numéro de lot' })
    async getStatistiquesControle(
        @Req() req: Request,
        @Query('numero_lot') numero_lot?: string,
    ) {
        const user = req.user as any; // typage personnalisé si disponible
        return this.enrollementsService.getStatistiquesControle(user?.userId,numero_lot);
    }

    // getStatsAdmin
    @UseGuards(JwtAuthGuard)
    @Post('stats/admin')
    @ApiOperation({ summary: 'Récupération des statistiques d’administration' })
    @ApiResponse({ status: 200, description: 'Statistiques d’administration.' })
    async getStatsAdmin(@Body() filters: EnrollementAdminFilterDto,@Req() req: Request,) {
        return this.enrollementsService.getStatsAdmin(filters);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/controle')
    @ApiOperation({ summary: 'Contrôle (validation ou rejet) d’un enrôlement' })
    @ApiResponse({ status: 200, description: 'Dossier contrôlé avec succès.' })
    async controlDossier( @Param('id') id: string, @Body() body: ControlEnrollementDto, @Req() req: Request ) {
        const user = req.user as any;
        return this.enrollementsService.controlEnrollement(id, user?.userId, body);
    }

    // @UseGuards(JwtAuthGuard)
    @Post('admin/filter/modeAffichage/params')
    @ApiOperation({ summary: 'Filtre des enrôlements par statut, période, découpage géographique, activité, spéculation, etc.' })
    @ApiResponse({ status: 200, description: 'Liste des enrôlements filtrés.' })
    async filterEnrollements( @Body() filters: FilterDto, @Query() params: PaginationParamsDto,) {
        return this.enrollementsService.enrollementFilter(filters, params);
    }

}

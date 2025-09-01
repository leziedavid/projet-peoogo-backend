import { ReversementService } from './reversement.service';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Controller, Post, Body, Req, UseGuards, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';
import { ReversementDto } from 'src/dto/request/reversement.dto';

@ApiTags('Reversements')
@ApiBearerAuth('access-token')
@Controller('reversement')
export class ReversementController {
    constructor(private readonly reversementService: ReversementService) {}
    
    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Créer un reversement pour un producteur' })
    @ApiResponse({ status: 201, description: 'Reversement créé avec succès.' })
    @ApiResponse({ status: 400, description: 'Données invalides.' })
    async create(@Body() dto: ReversementDto, @Req() req: Request) {
        const user = req.user as any;
        if (!user.id) throw new NotFoundException('Utilisateur non authentifié');
        return this.reversementService.createReversement(dto);
    }

    
    @UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({ summary: 'Récupérer tous les reversements' })
    @ApiResponse({ status: 200, description: 'Reversements récupérés avec succès.' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getAll(@Query() pagination: PaginationParamsDto) {
        return this.reversementService.getAllReversements(pagination);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiOperation({ summary: 'Récupérer un reversement par ID' })
    @ApiResponse({ status: 200, description: 'Reversement récupéré avec succès.' })
    @ApiResponse({ status: 404, description: 'Reversement introuvable.' })
    async getById(@Param('id') id: string) {
        const reversement = await this.reversementService.getReversementById(id);
        if (!reversement) throw new NotFoundException('Reversement non trouvé');
        return reversement;
    }

    @UseGuards(JwtAuthGuard)
    @Get('producer/:producerId')
    @ApiOperation({ summary: 'Récupérer les reversements d’un producteur' })
    @ApiResponse({ status: 200, description: 'Reversements récupérés avec succès.' })
    async getByProducer(@Param('producerId') producerId: string, @Query() pagination: PaginationParamsDto) {
        return this.reversementService.getReversementsByProducer(producerId, pagination);
    }

    @UseGuards(JwtAuthGuard)
    @Get('stats/total-gains')
    @ApiOperation({ summary: 'Statistiques globales des reversements et gains' })
    @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès.' })
    async getStats() {
        return this.reversementService.getReversementStats();
    }
}

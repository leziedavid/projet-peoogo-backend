import { Controller, Get, Post, Body, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { StatistiqueService } from './statistique.service';
import { UsersFilterDto } from 'src/dto/request/exportUsersFilter.dto';
import { EnrollementsFilterDto } from 'src/dto/request/exportEnrollementsFilter.dto';

@ApiTags('statistique')
@Controller('statistique')
export class StatistiqueController {
    constructor(private readonly statistiqueService: StatistiqueService) {}

    @Get('dashboard/compte')
    @ApiOperation({ summary: 'Récupération des statistiques de compte' })
    @ApiResponse({ status: 200, description: 'Statistiques de compte.' })
    async getDashboardStats() {
        return this.statistiqueService.getDashboardStats();
    }

    /**
     * Export Users filtré par période
     */
    @Post('users/export')
    @ApiOperation({ summary: 'Export des utilisateurs filtrés par date de création' })
    @ApiResponse({ status: 200, description: 'Fichier Excel.' })
    async exportUsersExcel(@Body() filter: UsersFilterDto, @Res() res: Response) {
        // Passer la réponse Express directement à la service pour écrire le fichier
        await this.statistiqueService.exportUsersExcel(res, filter);
    }

    /**
     * Export Enrollements filtré par status_dossier et période
     */
    @Post('enrollements/export')
    @ApiOperation({ summary: 'Export des enrôlements filtrés par statut dossier et période de date' })
    @ApiResponse({ status: 200, description: 'Fichier Excel.' })
    async exportEnrollementsExcel(@Body() filter: EnrollementsFilterDto, @Res() res: Response) {
        await this.statistiqueService.exportEnrollementsExcel(res, filter);
    }
}

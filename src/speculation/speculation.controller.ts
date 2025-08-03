// src/speculation/speculation.controller.ts

import {Controller,Get,Post,Body,Param,Put,Delete,UseInterceptors,BadRequestException, UploadedFile,} from '@nestjs/common';
import { SpeculationService } from './speculation.service';
import {CreateSpeculationDto,UpdateSpeculationDto,} from 'src/dto/request/speculation.dto';
import {ApiTags,ApiOperation,ApiResponse,ApiConsumes,ApiBody,} from '@nestjs/swagger';

import { FileInterceptor } from '@nestjs/platform-express';
import { ImportFileDto } from 'src/dto/request/import-file.dto';
import { Express } from 'express';

@ApiTags('Speculation')
@Controller('speculations')
export class SpeculationController {
    constructor(private readonly speculationService: SpeculationService) { }

    @Post()
    @ApiOperation({ summary: 'Créer plusieurs spéculations' })
    async create(@Body() dto: CreateSpeculationDto) {
        return this.speculationService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Liste des spéculations' })
    async findAll() {
        return this.speculationService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Récupérer une spéculation par ID' })
    async findOne(@Param('id') id: string) {
        return this.speculationService.findOne(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Mettre à jour une spéculation' })
    async update(@Param('id') id: string, @Body() dto: UpdateSpeculationDto) {
        return this.speculationService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer une spéculation' })
    async remove(@Param('id') id: string) {
        return this.speculationService.remove(id);
    }

    @Post('import')
    @ApiOperation({ summary: 'Importer des spéculations depuis un fichier CSV ou Excel' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: ImportFileDto })
    @ApiResponse({ status: 201, description: 'Importation réussie' })
    @ApiResponse({ status: 400, description: 'Fichier invalide' })
    @UseInterceptors(FileInterceptor('file'))
    async importFromFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('Fichier manquant');
        }

        const ext = file.originalname.split('.').pop().toLowerCase();
        let fileType: 'csv' | 'xlsx';

        if (ext === 'csv') {
            fileType = 'csv';
        } else if (ext === 'xls' || ext === 'xlsx') {
            fileType = 'xlsx';
        } else {
            throw new BadRequestException('Format de fichier non supporté. Utilisez CSV ou Excel.');
        }

        return this.speculationService.importFromExcelOrCsv(file.buffer, fileType);
    }
}

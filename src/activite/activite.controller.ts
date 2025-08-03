// src/activite/activite.controller.ts
import {Controller,Get,Post,Body,Param,Put,Delete,UseInterceptors,BadRequestException, UploadedFile,} from '@nestjs/common';
import { ActiviteService } from './activite.service';
import { CreateActiviteDto, UpdateActiviteDto } from 'src/dto/request/activite.dto';
import {ApiTags,ApiOperation,ApiResponse,ApiConsumes,ApiBody,} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportFileDto } from 'src/dto/request/import-file.dto';
import { Express } from 'express';

@ApiTags('Activite')
@Controller('activites')
export class ActiviteController {
    constructor(private readonly activiteService: ActiviteService) { }

    @Post()
    @ApiOperation({ summary: 'Créer plusieurs activités' })
    async create(@Body() dto: CreateActiviteDto) {
        return this.activiteService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Liste des activités' })
    async findAll() {
        return this.activiteService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Récupérer une activité' })
    async findOne(@Param('id') id: string) {
        return this.activiteService.findOne(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Mettre à jour une activité' })
    async update(@Param('id') id: string, @Body() dto: UpdateActiviteDto) {
        return this.activiteService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer une activité' })
    async remove(@Param('id') id: string) {
        return this.activiteService.remove(id);
    }

    @Post('import')
    @ApiOperation({ summary: 'Importer des activités depuis un fichier CSV ou Excel' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: ImportFileDto })
    @ApiResponse({ status: 201, description: 'Import réussi' })
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

        return this.activiteService.importFromExcelOrCsv(file.buffer, fileType);
    }
}

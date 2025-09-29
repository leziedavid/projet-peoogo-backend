// src/categorie/categorie.controller.ts
import {Controller,Get,Post,Body,Param,Put,Delete,UseInterceptors,BadRequestException,UploadedFile,} from '@nestjs/common';
import { CategorieService } from './categorie.service';
import { CreateCategorieDto, UpdateCategorieDto } from 'src/dto/request/categorie.dto';
import {ApiTags,ApiOperation,ApiResponse,ApiConsumes,ApiBody,} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportFileDto } from 'src/dto/request/import-file.dto';
import { Express } from 'express';

@ApiTags('Categorie')
@Controller('categories')
export class CategorieController {
    constructor(private readonly categorieService: CategorieService) { }

    @Post()
    @ApiOperation({ summary: 'Créer plusieurs catégories' })
    async create(@Body() dto: CreateCategorieDto) {
        return this.categorieService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Liste des catégories' })
    async findAll() {
        return this.categorieService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Récupérer une catégorie' })
    async findOne(@Param('id') id: string) {
        return this.categorieService.findOne(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Mettre à jour une catégorie' })
    async update(@Param('id') id: string, @Body() dto: UpdateCategorieDto) {
        return this.categorieService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer une catégorie' })
    async remove(@Param('id') id: string) {
        return this.categorieService.remove(id);
    }

    @Post('import')
    @ApiOperation({ summary: 'Importer des catégories depuis un fichier CSV ou Excel' })
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
            throw new BadRequestException(
                'Format de fichier non supporté. Utilisez CSV ou Excel.',
            );
        }

        return this.categorieService.importFromExcelOrCsv(file.buffer, fileType);
    }
}

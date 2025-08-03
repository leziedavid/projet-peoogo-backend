// src/import-decoupage/import-decoupage.controller.ts

import {Controller,Post,UploadedFile,UseInterceptors,BadRequestException, Get, Param,} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportDecoupageService } from './import-decoupage.service';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Express } from 'express';
import { ImportFileDto } from 'src/dto/request/import-file.dto';

@ApiTags('Import Decoupage')
@Controller('import-decoupage')
export class ImportDecoupageController {

    constructor(private readonly importService: ImportDecoupageService) { }

    @Post('upload')
    @ApiOperation({ summary: 'Importer un fichier CSV ou Excel pour le découpage' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: ImportFileDto })
    @ApiResponse({ status: 201, description: 'Import réussi' })
    @ApiResponse({ status: 400, description: 'Fichier invalide' })
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {

        if (!file) {
            throw new BadRequestException('Fichier manquant');
        }

        // Détecter le type à partir de l'extension ou mimetype
        const ext = file.originalname.split('.').pop().toLowerCase();

        let fileType: 'csv' | 'xlsx';
        if (ext === 'csv') {
            fileType = 'csv';
        } else if (ext === 'xls' || ext === 'xlsx') {
            fileType = 'xlsx';
        } else {
            throw new BadRequestException('Format de fichier non supporté. Utilisez CSV ou Excel.');
        }

        return this.importService.importFromExcelOrCsv(file.buffer, fileType);
    }

    // getAllDistricts
    @Get('districts')
    @ApiResponse({ status: 200, description: 'Liste des districts récupérée avec succès' })
    @ApiResponse({ status: 400, description: 'Erreur lors de la récupération des districts' })
    async getAllDistricts() {
        return this.importService.getAllDistricts();
    }
    
    // getRegionsByDistrict
    @Get('regions/:districtId')
    @ApiResponse({ status: 200, description: 'Liste des regions récupérée avec succès' })
    @ApiResponse({ status: 400, description: 'Erreur lors de la récupération des regions' })
    async getRegionsByDistrict(@Param('districtId') districtId: string) {
        return this.importService.getRegionsByDistrict(districtId);
    }

    // getDepartmentsByRegion
    @Get('departments/:regionId')
    @ApiResponse({ status: 200, description: 'Liste des departments récupérée avec succès' })   
    @ApiResponse({ status: 400, description: 'Erreur lors de la récupération des departments' })
    async getDepartmentsByRegion(@Param('regionId') regionId: string) {
        return this.importService.getDepartmentsByRegion(regionId);
    }

    // getSousPrefecturesByDepartment
    @Get('sous-prefectures/:departmentId')
    @ApiResponse({ status: 200, description: 'Liste des sous-préfectures récupérée avec succès' })
    @ApiResponse({ status: 400, description: 'Erreur lors de la récupération des sous-préfectures' })
    async getSousPrefecturesByDepartment(@Param('departmentId') departmentId: string) {
        return this.importService.getSousPrefecturesByDepartment(departmentId);
    }

    // getLocalitesBySousPrefecture
    @Get('localites/:sousPrefectureId')
    @ApiResponse({ status: 200, description: 'Liste des localités récupérée avec succès' })
    @ApiResponse({ status: 400, description: 'Erreur lors de la récupération des localités' })
    async getLocalitesBySousPrefecture(@Param('sousPrefectureId') sousPrefectureId: string) {
        return this.importService.getLocalitesBySousPrefecture(sousPrefectureId);
    }
    

}

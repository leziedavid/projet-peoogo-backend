import { Controller, Get, Patch, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SousPrefectureService } from './sous-prefecture.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { UpdateSousPrefectureDto } from 'src/dto/request/sous_prefecture.dto';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';

@ApiTags('Sous-préfectures')
@ApiBearerAuth('access-token')
@Controller('sous-prefectures')
export class SousPrefectureController {
    constructor(private readonly sousPrefectureService: SousPrefectureService) { }

    // @UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({ summary: 'Lister les sous-préfectures' })
    async findAll() {
        return this.sousPrefectureService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiOperation({ summary: 'Récupérer une sous-préfecture par ID' })
    async findOne(@Param('id') id: string) {
        return this.sousPrefectureService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour une sous-préfecture' })
    async update(@Param('id') id: string, @Body() dto: UpdateSousPrefectureDto) {
        return this.sousPrefectureService.update(id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer une sous-préfecture' })
    async remove(@Param('id') id: string) {
        return this.sousPrefectureService.remove(id);
    }


    @Get('paginate/liste/all')
    @ApiOperation({ summary: 'Liste paginée des sous-préfectures' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    async getAllparginate(@Query() params: PaginationParamsDto) {
        return this.sousPrefectureService.getAllparginate(params.page, params.limit);
    }



}

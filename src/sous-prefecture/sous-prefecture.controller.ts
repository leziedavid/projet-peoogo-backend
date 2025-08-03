import { Controller, Get, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SousPrefectureService } from './sous-prefecture.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { UpdateSousPrefectureDto } from 'src/dto/request/sous_prefecture.dto';

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
}

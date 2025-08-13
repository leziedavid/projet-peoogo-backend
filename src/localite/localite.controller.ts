import { Controller, Get, Patch, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { LocaliteService } from './localite.service';
import { UpdateLocaliteDto } from 'src/dto/request/localite.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';

@ApiTags('Localités')
@ApiBearerAuth('access-token')
@Controller('localites')
export class LocaliteController {
    constructor(private readonly localiteService: LocaliteService) { }

    // @UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({ summary: 'Lister les localités' })
    async findAll() {
        return this.localiteService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiOperation({ summary: 'Récupérer une localité par ID' })
    async findOne(@Param('id') id: string) {
        return this.localiteService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour une localité' })
    async update(@Param('id') id: string, @Body() dto: UpdateLocaliteDto) {
        return this.localiteService.update(id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer une localité' })
    async remove(@Param('id') id: string) {
        return this.localiteService.remove(id);
    }

    @Get('paginate/liste/all')
    @ApiOperation({ summary: 'Liste paginée des localités' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    async getAllparginate(@Query() params: PaginationParamsDto) {
        return this.localiteService.getAllparginate(params.page, params.limit);
    }





}

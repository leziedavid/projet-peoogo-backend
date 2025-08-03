import { Controller, Get, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RegionService } from './region.service';
import { UpdateRegionDto } from 'src/dto/request/region.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@ApiTags('Regions')
@ApiBearerAuth('access-token')
@Controller('regions')
export class RegionController {
    constructor(private readonly regionService: RegionService) { }

    // @UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({ summary: 'Lister les régions' })
    async findAll() {
        return this.regionService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiOperation({ summary: 'Récupérer une région par ID' })
    async findOne(@Param('id') id: string) {
        return this.regionService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour une région' })
    async update(@Param('id') id: string, @Body() dto: UpdateRegionDto) {
        return this.regionService.update(id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer une région' })
    async remove(@Param('id') id: string) {
        return this.regionService.remove(id);
    }
}

import { Controller, Get, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DistrictService } from './district.service';
import { UpdateDistrictDto } from 'src/dto/request/district.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@ApiTags('Districts')
@ApiBearerAuth('access-token')
@Controller('districts')
export class DistrictController {
    constructor(private readonly districtService: DistrictService) {}

    // @UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({ summary: 'Lister les districts' })
    async findAll() {
        return this.districtService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiOperation({ summary: 'Récupérer un district par ID' })
    async findOne(@Param('id') id: string) {
        return this.districtService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour un district' })
    async update(@Param('id') id: string, @Body() dto: UpdateDistrictDto) {
        return this.districtService.update(id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un district' })
    async remove(@Param('id') id: string) {
        return this.districtService.remove(id);
    }
}

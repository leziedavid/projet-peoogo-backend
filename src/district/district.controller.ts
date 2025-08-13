import { Controller, Get, Patch, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DistrictService } from './district.service';
import { UpdateDistrictDto } from 'src/dto/request/district.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';

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

    @UseGuards(JwtAuthGuard)
    @Get('paginate/liste/all')
    @ApiOperation({ summary: 'Lister les districts' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    async getAllparginate(@Query() params: PaginationParamsDto) {
        return this.districtService.getAllparginate(params.page, params.limit);
    }


}

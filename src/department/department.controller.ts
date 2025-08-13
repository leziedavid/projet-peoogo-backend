import { Controller, Get, Patch, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DepartmentService } from './department.service';
import { UpdateDepartmentDto } from 'src/dto/request/department.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';

@ApiTags('Departments')
@ApiBearerAuth('access-token')
@Controller('departments')
export class DepartmentController {
    constructor(private readonly departmentService: DepartmentService) { }

    // @UseGuards(JwtAuthGuard)
    @Get()
    @ApiOperation({ summary: 'Lister les départements' })
    async findAll() {
        return this.departmentService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiOperation({ summary: 'Récupérer un département par ID' })
    async findOne(@Param('id') id: string) {
        return this.departmentService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour un département' })
    async update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
        return this.departmentService.update(id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un département' })
    async remove(@Param('id') id: string) {
        return this.departmentService.remove(id);
    }

    @Get('paginate/liste/all')
    @ApiOperation({ summary: 'Liste paginée des départements' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    async getAllparginate(@Query() params: PaginationParamsDto) {
        return this.departmentService.getAllparginate(params.page, params.limit);
    }



}

import { Controller, Post, Get, Patch, Delete, Body, Param, UseInterceptors, UploadedFiles, UseGuards, Query, Req, } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth, ApiQuery, ApiBody, } from '@nestjs/swagger';
import { CreateEnrollementsDto, UpdateEnrollementsDto, } from 'src/dto/request/enrollements.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Request } from 'express';
import { EnrollementAdminFilterDto } from 'src/dto/request/enrollementAdminFilter.dto';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';
import { ControlEnrollementDto } from 'src/dto/request/control-enrollement.dto';
import { CreateProductDto, UpdateProductDto } from 'src/dto/request/product.dto';
import { ProductService } from './product.service';


@ApiTags('Product Api')
@ApiBearerAuth('access-token')
@Controller('product')
export class ProductController {
    constructor(private readonly productService: ProductService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Créer un nouveau produit' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors( FileFieldsInterceptor([ { name: 'image', maxCount: 1 }, { name: 'autreImage', maxCount: 10 }, ]))
    @ApiResponse({ status: 201, description: 'Produit créé avec succès.' })
    @ApiBody({ description: 'Données pour créer un produit avec fichiers', type: CreateProductDto, })
    async createProduct( @UploadedFiles() files: { image?: Express.Multer.File[]; autreImage?: Express.Multer.File[]; },
            @Body() dto: CreateProductDto,
            @Req() req: Request,
        ) {
            dto.image = files.image?.[0] ?? null;
            dto.autreImage = files.autreImage ?? null;
            const user = req.user as any;
            return this.productService.createProduct(dto, user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour un produit' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors( FileFieldsInterceptor([ { name: 'image', maxCount: 1 }, { name: 'autreImage', maxCount: 10 }, ]))
    @ApiResponse({ status: 200, description: 'Produit mis à jour.' })
    @ApiResponse({ status: 404, description: 'Produit non trouvé.' })
    async updateProducts(
        @Param('id') id: string,
        @UploadedFiles() files: { image?: Express.Multer.File[]; autreImage?: Express.Multer.File[]; },
        @Body() dto: UpdateProductDto,
        @Req() req: Request,) {

        dto.image = files.image?.[0] ?? null;
        dto.autreImage = files.autreImage ?? null;
        const user = req.user as any;
        return this.productService.updateProduct(id, dto,  user.userId);
    }
    

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un produit' })
    @ApiResponse({ status: 200, description: 'Produit supprimé (logique).' })
    async delete(@Param('id') id: string,@Req() req: Request,) {
        const user = req.user as any;
        return this.productService.deleteProduct(id, user.userId);
    }

    
    @Get()
    @ApiOperation({ summary: 'Liste paginée de tous les produits' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiResponse({ status: 200, description: 'Liste des produits récupérée avec succès.' })
    async getAllProducts(@Query() params: PaginationParamsDto) {
        return this.productService.getAllProducts(params);
    }

    // getAllProductsIsActive

    @Get('actives/liste')
    @ApiOperation({ summary: 'Liste paginée de tous les produits disponibles' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiResponse({ status: 200, description: 'Liste des produits récupérée avec succès.' })
    async getAllProductsIsActive(@Query() params: PaginationParamsDto) {
        return this.productService.getAllProductsIsActive(params);
    }

    @Get('listes/produits-avec-statut')
    @ApiOperation({ summary: 'Liste paginée de tous les produits avec leur statut et images' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiResponse({ status: 200, description: 'Liste des produits récupérée avec succès.' })
    async getAllProductsWithStatus(@Query() params: PaginationParamsDto) {
        return this.productService.getAllProductsWithStatus(params);
    }

    @UseGuards(JwtAuthGuard)
    @Get('all/produits-admin')
    @ApiOperation({ summary: 'Liste paginée de tous les produits admin' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiResponse({ status: 200, description: 'Liste des produits récupérée avec succès.' })
    async getAllProductsAdmin(@Query() params: PaginationParamsDto) {
        return this.productService.getAllProductsAdmin(params);
    }

    @UseGuards(JwtAuthGuard)
    @Get('produit-produiteur/:code')
    @ApiOperation({ summary: 'Liste paginée des produits produit produit' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiResponse({ status: 200, description: 'Liste des produits récupérée avec succès.' })
    async getProducteurProductsByCode(@Param('code') code: string, @Query() params: PaginationParamsDto) {
        return this.productService.getProducteurProductsByCode(code, params);
    }

    @Get('produit-produiteur/:code/stats')
    @ApiOperation({ summary: 'Statistiques des produits produit produit' })
    @ApiResponse({ status: 200, description: 'Statistiques des produits produit produit récupérée avec succès.' })
    async getProducteurProductStats(@Param('code') code: string) {
        return this.productService.getProducteurProductStats(code);
    }

    @Get('produit-global')
    @ApiOperation({ summary: 'Statistiques globales des produits produit produit' })
    @ApiResponse({ status: 200, description: 'Statistiques globales des produits produit produit récupérée avec succès.' })
    async getGlobalProductStats() {
        return this.productService.getGlobalProductStats();
    }



}

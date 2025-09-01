import { Controller, Post, Get, Patch, Delete, Body, Param, UseInterceptors, UploadedFiles, UseGuards, Query, Req, } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth, ApiQuery, ApiBody, } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Request } from 'express';
import { PaginationParamsDto } from 'src/dto/request/pagination-params.dto';
import { CreateProductDto, UpdateProductDto } from 'src/dto/request/product.dto';
import { ProductService } from './product.service';
import { MarketProduitFilterDto } from 'src/dto/request/marketProduitFilter.dto';
import { UpdateAvailabilityDto, UpdateQuantityDto } from 'src/dto/request/updateAvailabilityQuantity.dto';


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
    async createProduct( @UploadedFiles() files: { image?: Express.Multer.File[]; autreImage?: Express.Multer.File[]; }, @Body() dto: CreateProductDto, @Req() req: Request,) {
            dto.image = files.image?.[0] ?? null;
            dto.autreImage = files.autreImage ?? null;
            const user = req.user as any;
            return this.productService.createProduct(dto, user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/availability')
    @ApiOperation({ summary: 'Mettre à jour la période de disponibilité d’un produit' })
    @ApiResponse({ status: 200, description: 'Période de disponibilité mise à jour avec succès.' })
    @ApiBody({ description: 'Période de disponibilité mise à jour', type: UpdateAvailabilityDto })
    async updateAvailability(
        @Param('id') id: string,
        @Body('disponibleDe') disponibleDe: string,
        @Body('disponibleJusqua') disponibleJusqua: string,
    ) {
        return this.productService.updateAvailability(id, disponibleDe, disponibleJusqua);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/quantity/update')
    @ApiOperation({ summary: 'Mettre à jour la quantité d’un produit' })
    @ApiResponse({ status: 200, description: 'Quantité mise à jour avec succès.' })
    @ApiBody({ description: 'Quantité mise à jour', type: UpdateQuantityDto })
    async updateQuantity(
        @Param('id') id: string,
        @Body('quantite') quantite: number,
    ) {
        return this.productService.updateQuantity(id, quantite);
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
        return this.productService.updateProduct(id, dto,  user.id);
    }
    

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un produit' })
    @ApiResponse({ status: 200, description: 'Produit supprimé (logique).' })
    async delete(@Param('id') id: string,@Req() req: Request,) {
        const user = req.user as any;
        return this.productService.deleteProduct(id, user.id);
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

    // geProduitstById
    
    @Get('get-produit/:id')
    @ApiOperation({ summary: 'Récupérer un produit par ID' })
    @ApiResponse({ status: 200, description: 'Produit trouvé.' })
    async geProduitstById(@Param('id') id: string) {
        return this.productService.geProduitstById(id);
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
    @Get('donnees/produit-produiteur')
    @ApiOperation({ summary: 'Liste paginée des produits produit produit' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiResponse({ status: 200, description: 'Liste des produits récupérée avec succès.' })
    async getProducteurProductsByCode(
        @Query() params: PaginationParamsDto,
        @Query('code') code: string,  ) {
        return this.productService.getProducteurProductsByCode(code, params);
    }

    @Get('produit-produiteur/statistiques/:code')
    @ApiOperation({ summary: 'Statistiques des produits produit produit' })
    @ApiResponse({ status: 200, description: 'Statistiques des produits produit produit récupérée avec succès.' })
    async getProducteurProductStats(@Param('code') code: string) {
        return this.productService.getProducteurProductStats(code);
    }

    @Get('lites/produit-global-admin-all')
    @ApiOperation({ summary: 'Statistiques globales des produits produit produit' })
    @ApiResponse({ status: 200, description: 'Statistiques globales des produits produit produit récupérée avec succès.' })
    async getGlobalProductStats() {
        return this.productService.getGlobalProductStats();
    }

    // filterProductsWithStatus
    @Post('filter-produits-with-status')
    @ApiOperation({ summary: 'Filtrer les produits par statut, période, découpage géographique, activité, spéculation, etc.' })
    @ApiResponse({ status: 200, description: 'Liste des produits filtrés.' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    async filterProductsWithStatus(
        @Body() dto: MarketProduitFilterDto,
        @Query() params: PaginationParamsDto) {
        return this.productService.filterProductsWithStatus( dto, params);
    }


}

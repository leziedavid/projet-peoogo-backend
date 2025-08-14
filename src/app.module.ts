// src/app.module.ts
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UtilsModule } from './utils/utils.module';
import { NotificationModule } from './utils/notification.module';  // <--- ici
import { ConfigModule } from '@nestjs/config';
import { WalletModule } from './wallet/wallet.module';
import { NotificationsGatewayModule } from './notifications-gateway/notifications-gateway.module';
import { EcommerceOrderModule } from './ecommerce-order/ecommerce-order.module';
import { ImportDecoupageModule } from './import-decoupage/import-decoupage.module';
import { EnrollementsModule } from './enrollements/enrollements.module';
import { ActiviteModule } from './activite/activite.module';
import { SpeculationModule } from './speculation/speculation.module';
import { DistrictModule } from './district/district.module';
import { RegionModule } from './region/region.module';
import { DepartmentModule } from './department/department.module';
import { SousPrefectureModule } from './sous-prefecture/sous-prefecture.module';
import { LocaliteModule } from './localite/localite.module';
import { ProductModule } from './product/product.module';
import { MessageModule } from './message/message.module';
import { StatistiqueModule } from './statistique/statistique.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MulterModule.register({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 }, }),
    PrismaModule,
    UtilsModule,
    NotificationModule,  // <--- injection ici
    AuthModule,
    WalletModule,
    NotificationsGatewayModule,
    EcommerceOrderModule,
    ImportDecoupageModule,
    EnrollementsModule,
    ActiviteModule,
    SpeculationModule,
    DistrictModule,
    RegionModule,
    DepartmentModule,
    SousPrefectureModule,
    LocaliteModule,
    ProductModule,
    MessageModule,
    StatistiqueModule,
    
  ],
})
export class AppModule {}

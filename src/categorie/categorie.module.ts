import { Module } from '@nestjs/common';
import { CategorieController } from './categorie.controller';
import { CategorieService } from './categorie.service';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CloudinaryService } from 'src/utils/cloudinary.service';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
import { FunctionService } from 'src/utils/pagination.service';

@Module({

  imports: [
    ConfigModule, // 👈 pour injection locale (non nécessaire si global)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        return {
          secret: config.get<string>('JWT_SECRET'),
          signOptions: { expiresIn: config.get<string>('JWT_ACCESS_EXPIRE') || '15m' }, // par défaut 15m
        };
      }
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    PrismaModule,
  ],

  providers: [CategorieService, CloudinaryService, JwtStrategy, FunctionService],  // <-- JwtStrategy ajouté ici
  controllers: [CategorieController],
})
export class CategorieModule { }

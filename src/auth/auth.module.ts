import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';       // <-- Ajouté
import { CloudinaryService } from 'src/utils/cloudinary.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FunctionService } from 'src/utils/pagination.service';
import { LocalStorageService } from 'src/utils/LocalStorageService';
    
@Module({
    imports: [
    ConfigModule, // 👈 pour injection locale (non nécessaire si global)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        console.log('JWT_SECRET from ConfigService:', config.get<string>('JWT_SECRET'));
        return {
          secret: config.get<string>('JWT_SECRET'),
          signOptions: { expiresIn: config.get<string>('JWT_ACCESS_EXPIRE') || '15m' }, // par défaut 15m
        };
      }
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    PrismaModule,
  ],
  providers: [AuthService, CloudinaryService, JwtStrategy,FunctionService,LocalStorageService],  // <-- JwtStrategy ajouté ici
  controllers: [AuthController],
  exports: [PassportModule, JwtModule],                       // <-- exporter pour pouvoir utiliser JwtAuthGuard ailleurs
})
export class AuthModule { }

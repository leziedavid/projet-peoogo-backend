import { Module } from '@nestjs/common';
import { SousPrefectureService } from './sous-prefecture.service';
import { SousPrefectureController } from './sous-prefecture.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from 'src/prisma/prisma.module';
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
  providers: [SousPrefectureService, JwtStrategy, FunctionService],  // <-- JwtStrategy ajouté ici
  exports: [PassportModule, JwtModule],

  controllers: [SousPrefectureController]
})
export class SousPrefectureModule { }

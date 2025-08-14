import { Module } from '@nestjs/common';
import { SpeculationService } from './speculation.service';
import { SpeculationController } from './speculation.controller';
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
        console.log('JWT_SECRET from ConfigService:', config.get<string>('JWT_SECRET'));
        return {
          secret: config.get<string>('JWT_SECRET'),
          signOptions: { expiresIn: config.get<string>('JWT_EXPIRE') || '3d' },
        };
      }
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    PrismaModule,
  ],
  providers: [SpeculationService, CloudinaryService, JwtStrategy, FunctionService],  // <-- JwtStrategy ajouté ici
  exports: [PassportModule, JwtModule],

  controllers: [SpeculationController]
})
export class SpeculationModule { }

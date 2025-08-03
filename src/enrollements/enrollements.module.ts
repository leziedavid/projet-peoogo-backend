import { Module } from '@nestjs/common';
import { EnrollementsService } from './enrollements.service';
import { EnrollementsController } from './enrollements.controller';
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
            signOptions: { expiresIn: config.get<string>('JWT_EXPIRE') || '1d' },
          };
        }
      }),
      PassportModule.register({ defaultStrategy: 'jwt' }),
      PrismaModule,
    ],
      providers: [EnrollementsService, CloudinaryService, JwtStrategy,FunctionService],  // <-- JwtStrategy ajouté ici
    exports: [PassportModule, JwtModule],

  controllers: [EnrollementsController]
})
export class EnrollementsModule {}

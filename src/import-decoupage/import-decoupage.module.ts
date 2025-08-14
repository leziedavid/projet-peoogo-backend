import { Module } from '@nestjs/common';
import { ImportDecoupageService } from './import-decoupage.service';
import { ImportDecoupageController } from './import-decoupage.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FunctionService } from 'src/utils/pagination.service';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
import { NotificationService } from 'src/utils/notification';

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
      PrismaModule], // <<<< important !
    providers: [ImportDecoupageService,FunctionService,JwtStrategy,NotificationService],
    exports: [PassportModule, JwtModule],
  controllers: [ImportDecoupageController]
})
export class ImportDecoupageModule {}

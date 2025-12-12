import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AllExceptionsFilter } from './utils/all-exceptions.filter';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  // Création de l'application Express
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Récupérer ConfigService via app.get()
  const configService = app.get(ConfigService);

  // ----------------------------
  // Configuration globale
  // ----------------------------
  app.setGlobalPrefix('api/v1');

  // Dossier statique pour les uploads, via ConfigService
  const fileStoragePath = configService.get<string>('FILE_STORAGE_PATH') || '/app/uploads';
  app.useStaticAssets(join(fileStoragePath), {
    prefix: '/uploads/',
  });

  // ⚡ Indiquer à Express que l'app est derrière un proxy (Caddy)
  app.set('trust proxy', true);

  // CORS sécurisé
  const allowedOrigins = [
    'https://peoogo.com',
    'https://api.peoogo.com',
    'https://backend.peoogo.com',
    'https://dev.peoogo.com',
    'http://localhost:3000', // ✅ ton front Next.js
    'https://peoogo.com:3000', // ✅ ton front Next.js
    'http://109.199.107.23:3000', // ✅ ton front Next.js
    'http://109.199.107.23:4000', // ✅ ton backend
    'http://109.199.107.23:4001', // ✅ ton backend
    'http://localhost:4000', // ✅ ton backend
  ];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // ----------------------------
  // Swagger
  // ----------------------------
  const config = new DocumentBuilder()
    .setTitle('PROJET PEEGO')
    .setDescription('API POUR LE PROJET PEEGO')
    .setVersion('1.0')
    .addTag('PEEGO')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Entrez le token JWT',
        in: 'header',
      },
      'access-token',
    )
    .addServer('http://109.199.107.23:4000', 'dev avec adress IP')
    .addServer('http://109.199.107.23:4001', 'preprod avec adress IP')
    .addServer('https://api.peoogo.com', 'Production')
    .addServer('https://backend.peoogo.com', 'Test backend')
    .addServer('https://dev.peoogo.com', 'Dev')
    .addServer('http://localhost:4000', 'Local')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Swagger accessible sur /api
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Garde le token entre les refresh
    },
  });

  // Appliquer le filtre global
  app.useGlobalFilters(new AllExceptionsFilter());

  // ----------------------------
  // Lancer le serveur
  // ----------------------------
  const port = configService.get<number>('PORT') || 4000;
  await app.listen(port);

  console.log(`🚀 API running on port ${port}`);
}

bootstrap();

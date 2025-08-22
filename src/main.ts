import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {

  // const app = await NestFactory.create(AppModule);
    // 👇 précise que ton app utilise Express
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api/v1');
  
    // 🔥 Sert /app/uploads comme dossier statique
  app.useStaticAssets(join(process.env.FILE_STORAGE_PATH || '/app/uploads'), {
    prefix: '/uploads/',
  });

  const config = new DocumentBuilder()
    .setTitle('PROJET PEEGO')
    .setDescription('API POUR LE PROJET PEEGO')
    .setVersion('1.0')
    .addTag('PEEGO')
    .addBearerAuth( // 🔐 Ajout du support pour JWT
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Entrez le token JWT',
        in: 'header',
      },
      'access-token', // nom de la sécurité à réutiliser avec @ApiBearerAuth('access-token')
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.enableCors();

  await app.listen(4000);
}
bootstrap();

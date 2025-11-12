// File: src/main.ts

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { stringify as stringifyYaml } from 'yaml';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { SpotifyAuthService } from './spotify/auth/spotify-auth.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  const hostUrl = configService.get<string>('HOST_URL') ?? 'https://songbird.starchildmusic.com';

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Songbird API')
    .setDescription(
      'Aggregated music intelligence from Spotify, Last.fm, and Deezer with unified authentication, caching, and playlist workflows.',
    )
    .setVersion('0.2.1')
    .addServer(hostUrl, 'Production (HTTPS)')
    .addServer(`http://localhost:${port}`, 'Local development')
    .build();

  const openApiDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, openApiDocument, {
    jsonDocumentUrl: '/openapi.json',
  });

  const yamlDocument = stringifyYaml(openApiDocument);
  const server = app.getHttpAdapter().getInstance();
  server.get('/openapi.yaml', (_req, res) => {
    res.type('text/yaml; charset=utf-8').send(yamlDocument);
  });

  // Fetch and log the Spotify bearer token on startup
  try {
    const authService = app.get(SpotifyAuthService);
    await authService.getAccessToken();
  } catch (error) {
    console.error('Failed to obtain Spotify token on startup:', error);
  }

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();

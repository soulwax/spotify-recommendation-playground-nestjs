// File: src/app.module.ts

import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DeezerModule } from './deezer/deezer.module';
import { LastfmModule } from './lastfm/lastfm.module';
import { SpotifyModule } from './spotify/spotify.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        SPOTIFY_CLIENT_ID: Joi.string().required(),
        SPOTIFY_CLIENT_SECRET: Joi.string().required(),
        LASTFM_API_KEY: Joi.string().required(),
        LASTFM_SHARED_SECRET: Joi.string().required(),
        LASTFM_APPLICATION_NAME: Joi.string().required(),
        LASTFM_REGISTERED_TO: Joi.string().required(),
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string().default('development'),
      }),
    }),
    HttpModule,
    SpotifyModule,
    LastfmModule,
    DeezerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

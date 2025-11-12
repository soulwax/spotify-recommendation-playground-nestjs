// File: src/spotify/spotify.module.ts

import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SpotifyAuthService } from './auth/spotify-auth.service';
import { SpotifyController } from './spotify.controller';
import { SpotifyService } from './spotify.service';

@Module({
    imports: [HttpModule, ConfigModule],
    controllers: [SpotifyController],
    providers: [SpotifyService, SpotifyAuthService],
    exports: [SpotifyService],
})
export class SpotifyModule { }

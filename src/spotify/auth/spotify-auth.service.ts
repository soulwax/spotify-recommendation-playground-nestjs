// File: src/spotify/auth/spotify-auth.service.ts

import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface SpotifyToken {
  access_token: string;
  expires_in: number;
  timestamp: number;
}

@Injectable()
export class SpotifyAuthService {
  private readonly logger = new Logger(SpotifyAuthService.name);
  private spotifyToken: SpotifyToken | null = null;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getAccessToken(): Promise<string> {
    if (this.spotifyToken && !this.isTokenExpired(this.spotifyToken)) {
      return this.spotifyToken.access_token;
    }

    try {
      const clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID');
      const clientSecret = this.configService.get<string>(
        'SPOTIFY_CLIENT_SECRET',
      );

      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
        'base64',
      );

      const response = await firstValueFrom(
        this.httpService.post<{ access_token: string; expires_in: number }>(
          'https://accounts.spotify.com/api/token',
          'grant_type=client_credentials',
          {
            headers: {
              Authorization: `Basic ${credentials}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      this.spotifyToken = {
        access_token: response.data.access_token,
        expires_in: response.data.expires_in,
        timestamp: Date.now(),
      };

      this.logger.log('Spotify access token obtained');
      this.logger.log(`Bearer Token: ${this.spotifyToken.access_token}`);
      this.logger.log(`Token expires in: ${this.spotifyToken.expires_in} seconds`);
      return this.spotifyToken.access_token;
    } catch (error) {
      this.logger.error('Failed to obtain Spotify access token', error);
      throw new Error('Spotify authentication failed');
    }
  }

  private isTokenExpired(token: SpotifyToken): boolean {
    const expiryTime = token.timestamp + token.expires_in * 1000;
    return Date.now() >= expiryTime - 60000;
  }
}

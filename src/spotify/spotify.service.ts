// File: src/spotify/spotify.service.ts

import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { SpotifyAuthService } from './auth/spotify-auth.service';
import {
    RecommendationQueryDto,
    RecommendationResponseDto,
    SearchTracksDto,
    TrackDto,
} from './dtos/index';

@Injectable()
export class SpotifyService {
    private readonly logger = new Logger(SpotifyService.name);
    private readonly baseUrl = 'https://api.spotify.com/v1';

    constructor(
        private readonly httpService: HttpService,
        private readonly authService: SpotifyAuthService,
    ) { }

    async searchTracks(query: SearchTracksDto): Promise<TrackDto[]> {
        if (!query.query || query.query.trim().length === 0) {
            throw new BadRequestException('Search query cannot be empty');
        }

        try {
            const token = await this.authService.getAccessToken();
            const params = new URLSearchParams({
                q: query.query,
                type: 'track',
                limit: (query.limit || 10).toString(),
            });

            const response = await firstValueFrom(
                this.httpService.get(`${this.baseUrl}/search`, {
                    params,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }),
            );

            return response.data.tracks.items.map((track: any) => ({
                id: track.id,
                name: track.name,
                artists: track.artists.map((a: any) => ({
                    name: a.name,
                    id: a.id,
                })),
                album: { name: track.album.name },
                popularity: track.popularity,
                preview_url: track.preview_url,
                external_urls: { spotify: track.external_urls.spotify },
            }));
        } catch (error) {
            this.logger.error('Track search failed', error);
            
            // Extract more detailed error information
            if (error.response) {
                // Axios error with response
                const status = error.response.status;
                const statusText = error.response.statusText;
                const data = error.response.data;
                
                this.logger.error(
                    `Spotify API error: ${status} ${statusText}`,
                    JSON.stringify(data, null, 2),
                );
                
                if (status === 400) {
                    throw new BadRequestException(
                        data?.error?.message || 'Invalid search query',
                    );
                } else if (status === 401) {
                    throw new BadRequestException('Spotify authentication failed. Please check your credentials.');
                } else if (status === 403) {
                    throw new BadRequestException('Spotify API access forbidden. Check your app permissions.');
                } else if (status === 429) {
                    throw new BadRequestException('Rate limit exceeded. Please try again later.');
                } else {
                    throw new Error(
                        `Spotify API error: ${status} ${statusText} - ${data?.error?.message || 'Unknown error'}`,
                    );
                }
            } else if (error.request) {
                // Request made but no response received
                this.logger.error('No response from Spotify API', error.request);
                throw new Error('No response from Spotify API. Please check your network connection.');
            } else {
                // Error setting up the request
                this.logger.error('Error setting up search request', error.message);
                throw new Error(`Failed to search tracks: ${error.message}`);
            }
        }
    }

    async getRecommendations(
        query: RecommendationQueryDto,
    ): Promise<RecommendationResponseDto> {
        const hasSeeds =
            (query.seed_tracks && query.seed_tracks.trim().length > 0) ||
            (query.seed_artists && query.seed_artists.trim().length > 0) ||
            (query.seed_genres && query.seed_genres.trim().length > 0);

        if (!hasSeeds) {
            throw new BadRequestException(
                'At least one seed (tracks, artists, or genres) is required',
            );
        }

        try {
            const token = await this.authService.getAccessToken();
            const params: Record<string, any> = {
                limit: Math.min(query.limit || 20, 100),
            };

            if (query.seed_tracks) params.seed_tracks = query.seed_tracks;
            if (query.seed_artists) params.seed_artists = query.seed_artists;
            if (query.seed_genres) params.seed_genres = query.seed_genres;
            if (query.market) params.market = query.market;
            if (query.target_danceability !== undefined)
                params.target_danceability = query.target_danceability;
            if (query.target_popularity !== undefined)
                params.target_popularity = query.target_popularity;

            // Default values for diversity
            if (params.target_danceability === undefined)
                params.target_danceability = 0.5;
            if (params.target_popularity === undefined)
                params.target_popularity = 50;

            const response = await firstValueFrom(
                this.httpService.get(`${this.baseUrl}/recommendations`, {
                    params,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }),
            );

            return {
                seeds: response.data.seeds,
                tracks: response.data.tracks.map((track: any) => ({
                    id: track.id,
                    name: track.name,
                    artists: track.artists.map((a: any) => ({
                        name: a.name,
                        id: a.id,
                    })),
                    album: { name: track.album.name },
                    popularity: track.popularity,
                    preview_url: track.preview_url,
                    external_urls: { spotify: track.external_urls.spotify },
                })),
            };
        } catch (error) {
            this.logger.error('Recommendation fetch failed', error);
            
            // Extract more detailed error information
            if (error.response) {
                // Axios error with response
                const status = error.response.status;
                const statusText = error.response.statusText;
                const data = error.response.data;
                
                this.logger.error(
                    `Spotify API error: ${status} ${statusText}`,
                    JSON.stringify(data, null, 2),
                );
                
                if (status === 400) {
                    throw new BadRequestException(
                        data?.error?.message || 'Invalid recommendation request parameters',
                    );
                } else if (status === 401) {
                    throw new BadRequestException('Spotify authentication failed. Please check your credentials.');
                } else if (status === 403) {
                    throw new BadRequestException('Spotify API access forbidden. Check your app permissions.');
                } else if (status === 429) {
                    throw new BadRequestException('Rate limit exceeded. Please try again later.');
                } else {
                    throw new Error(
                        `Spotify API error: ${status} ${statusText} - ${data?.error?.message || 'Unknown error'}`,
                    );
                }
            } else if (error.request) {
                // Request made but no response received
                this.logger.error('No response from Spotify API', error.request);
                throw new Error('No response from Spotify API. Please check your network connection.');
            } else {
                // Error setting up the request
                this.logger.error('Error setting up recommendation request', error.message);
                throw new Error(`Failed to get recommendations: ${error.message}`);
            }
        }
    }
}

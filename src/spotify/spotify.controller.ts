// File: src/spotify/spotify.controller.ts

import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
    RecommendationQueryDto,
    RecommendationResponseDto,
    TrackDto
} from './dtos/index';
import { SpotifyService } from './spotify.service';

@Controller('api/spotify')
export class SpotifyController {
    constructor(private readonly spotifyService: SpotifyService) { }

    @Get('search/tracks')
    async searchTracks(
        @Query('query') query: string,
        @Query('limit') limit?: number,
    ): Promise<TrackDto[]> {
        return this.spotifyService.searchTracks({ query, limit });
    }

    @Get('recommendations')
    async getRecommendations(
        @Query() queryParams: RecommendationQueryDto,
    ): Promise<RecommendationResponseDto> {
        return this.spotifyService.getRecommendations(queryParams);
    }

    @Post('recommendations/from-search')
    async getRecommendationsFromSearch(
        @Body() body: { query: string; limit?: number },
    ): Promise<RecommendationResponseDto> {
        const tracks = await this.spotifyService.searchTracks({
            query: body.query,
            limit: 1,
        });

        if (tracks.length === 0) {
            throw new Error('No tracks found');
        }

        return this.spotifyService.getRecommendations({
            seed_tracks: tracks[0].id,
            limit: body.limit || 20,
            target_danceability: 0.6,
            target_popularity: 60,
        });
    }
}

// File: src/spotify/dtos/recommendation.dto.ts

import { TrackDto } from './track.dto';

export class RecommendationQueryDto {
    seed_tracks?: string;
    seed_artists?: string;
    seed_genres?: string;
    limit?: number;
    market?: string;
    target_danceability?: number;
    target_popularity?: number;
}

export class RecommendationResponseDto {
    seeds: Array<{
        id: string;
        type: string;
        initialPoolSize: number;
    }>;
    tracks: TrackDto[];
}

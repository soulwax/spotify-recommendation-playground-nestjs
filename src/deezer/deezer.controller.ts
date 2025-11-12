import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { DeezerService } from './deezer.service';
import {
    ConvertToDeezerRequestDto,
    ConvertToDeezerResponseDto,
} from './dtos/convert.dto';

@Controller('api/deezer')
export class DeezerController {
    constructor(private readonly deezerService: DeezerService) {}

    @Get('search/tracks')
    async searchTracks(
        @Query('query') query: string,
        @Query('limit') limit?: number,
    ) {
        return this.deezerService.searchTracks(query, limit);
    }

    @Get('track/find-id')
    async findTrackId(
        @Query('name') name: string,
        @Query('artist') artist?: string,
    ) {
        const trackId = await this.deezerService.findTrackId(name, artist);
        return {
            name,
            artist,
            deezerId: trackId,
        };
    }

    @Post('tracks/convert')
    async convertTracksToDeezerIds(
        @Body() body: ConvertToDeezerRequestDto,
    ): Promise<ConvertToDeezerResponseDto> {
        if (!body.tracks || body.tracks.length === 0) {
            throw new Error('At least one track is required');
        }

        const results = await this.deezerService.convertTracksToDeezerIds(
            body.tracks,
        );

        const converted = results.filter((r) => r.deezerId !== null).length;

        return {
            converted,
            total: results.length,
            tracks: results,
        };
    }
}


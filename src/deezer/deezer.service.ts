import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DeezerService {
    private readonly logger = new Logger(DeezerService.name);
    private readonly baseUrl = 'https://api.deezer.com';

    constructor(private readonly httpService: HttpService) {}

    /**
     * Search for tracks on Deezer
     * @param query Search query string
     * @param limit Number of results (default: 25, max: 25)
     */
    async searchTracks(query: string, limit: number = 25): Promise<any> {
        if (!query || query.trim().length === 0) {
            throw new BadRequestException('Search query cannot be empty');
        }

        try {
            const params = {
                q: query,
                limit: Math.min(limit, 25).toString(),
            };

            const url = `${this.baseUrl}/search`;
            this.logger.debug(`Searching Deezer for: ${query}`);

            const response = await firstValueFrom(
                this.httpService.get(url, { params }),
            );

            // Deezer API returns data in response.data.data array
            return response.data;
        } catch (error) {
            this.logger.error('Deezer track search failed', error);
            
            if (error.response) {
                const status = error.response.status;
                const data = error.response.data;
                
                if (status === 400) {
                    throw new BadRequestException(
                        data?.error?.message || 'Invalid Deezer API request',
                    );
                } else if (status === 403) {
                    throw new BadRequestException('Deezer API access forbidden');
                } else if (status === 429) {
                    throw new BadRequestException('Rate limit exceeded. Please try again later.');
                } else {
                    throw new Error(
                        `Deezer API error: ${status} - ${data?.error?.message || 'Unknown error'}`,
                    );
                }
            } else if (error.request) {
                throw new Error('No response from Deezer API. Please check your network connection.');
            } else {
                throw new Error(`Failed to search Deezer tracks: ${error.message}`);
            }
        }
    }

    /**
     * Find Deezer track ID for a given track
     * @param trackName Track name
     * @param artistName Artist name
     * @returns Deezer track ID or null if not found
     */
    async findTrackId(trackName: string, artistName?: string): Promise<number | null> {
        if (!trackName || trackName.trim().length === 0) {
            throw new BadRequestException('Track name is required');
        }

        try {
            // Build search query
            const searchQuery = artistName
                ? `artist:"${artistName}" track:"${trackName}"`
                : `track:"${trackName}"`;

            const searchResults = await this.searchTracks(searchQuery, 5);

            // Deezer API returns tracks in response.data.data array
            const tracks = searchResults?.data || [];

            if (tracks.length > 0) {
                // Try to find exact match first
                const exactMatch = tracks.find(
                    (track: any) =>
                        track.title?.toLowerCase() === trackName.toLowerCase() &&
                        (!artistName ||
                            track.artist?.name?.toLowerCase() === artistName.toLowerCase()),
                );

                if (exactMatch) {
                    this.logger.debug(`Found exact match: ${exactMatch.id} - ${exactMatch.title}`);
                    return exactMatch.id;
                }

                // Return first result if no exact match
                const firstResult = tracks[0];
                this.logger.debug(`Found approximate match: ${firstResult.id} - ${firstResult.title}`);
                return firstResult.id;
            }

            this.logger.warn(`No Deezer track found for: ${trackName} by ${artistName || 'unknown artist'}`);
            return null;
        } catch (error) {
            this.logger.error(`Failed to find Deezer track ID for: ${trackName}`, error);
            return null;
        }
    }

    /**
     * Convert an array of tracks to Deezer track IDs
     * @param tracks Array of tracks with name and optional artist
     * @returns Array of objects with original track info and Deezer ID
     */
    async convertTracksToDeezerIds(
        tracks: Array<{ name: string; artist?: string }>,
    ): Promise<Array<{ name: string; artist?: string; deezerId: number | null }>> {
        const results: Array<{ name: string; artist?: string; deezerId: number | null }> = [];

        this.logger.debug(`Converting ${tracks.length} tracks to Deezer IDs`);

        for (const track of tracks) {
            try {
                const deezerId = await this.findTrackId(track.name, track.artist);
                results.push({
                    name: track.name,
                    artist: track.artist,
                    deezerId,
                });
            } catch (error) {
                this.logger.warn(`Failed to convert track: ${track.name}`, error);
                results.push({
                    name: track.name,
                    artist: track.artist,
                    deezerId: null,
                });
            }
        }

        return results;
    }
}


// File: src/lastfm/lastfm.service.ts

import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { LastfmAuthService } from './auth/lastfm-auth.service';
import {
    LastfmSongInputDto,
    LastfmSpiceUpRequestDto,
    LastfmSpiceUpResponseDto,
} from './dtos/spice-up.dto';
import { LastfmSpiceUpWithDeezerResponseDto } from './dtos/spice-up-with-deezer.dto';

@Injectable()
export class LastfmService {
    private readonly logger = new Logger(LastfmService.name);
    private readonly baseUrl = 'https://ws.audioscrobbler.com/2.0';

    constructor(
        private readonly httpService: HttpService,
        private readonly authService: LastfmAuthService,
    ) {}

    /**
     * Make a GET request to Last.fm API
     */
    private async makeRequest(
        method: string,
        params: Record<string, string> = {},
        requireSignature: boolean = false,
    ): Promise<any> {
        try {
            const queryParams = {
                method,
                ...params,
            };

            const queryString = this.authService.buildQueryString(queryParams, requireSignature);
            const url = `${this.baseUrl}?${queryString}`;

            this.logger.debug(`Making Last.fm API request: ${method}`);

            const response = await firstValueFrom(
                this.httpService.get(url),
            );

            if (response.data.error) {
                throw new BadRequestException(
                    `Last.fm API error: ${response.data.message || response.data.error}`,
                );
            }

            return response.data;
        } catch (error) {
            this.logger.error(`Last.fm API request failed for method: ${method}`, error);
            
            if (error.response) {
                const status = error.response.status;
                const data = error.response.data;
                
                if (status === 400) {
                    throw new BadRequestException(
                        data?.message || 'Invalid Last.fm API request',
                    );
                } else if (status === 401) {
                    throw new BadRequestException('Last.fm API authentication failed');
                } else if (status === 403) {
                    throw new BadRequestException('Last.fm API access forbidden');
                } else {
                    throw new Error(
                        `Last.fm API error: ${status} - ${data?.message || 'Unknown error'}`,
                    );
                }
            } else if (error.request) {
                throw new Error('No response from Last.fm API. Please check your network connection.');
            } else {
                throw new Error(`Failed to make Last.fm API request: ${error.message}`);
            }
        }
    }

    /**
     * Get track information
     * @param artist Artist name
     * @param track Track name
     * @param mbid Optional MusicBrainz ID
     */
    async getTrackInfo(artist: string, track: string, mbid?: string): Promise<any> {
        if (!artist || !track) {
            throw new BadRequestException('Artist and track are required');
        }

        const params: Record<string, string> = {
            artist,
            track,
        };

        if (mbid) {
            params.mbid = mbid;
        }

        const response = await this.makeRequest('track.getInfo', params);
        return response.track;
    }

    /**
     * Get artist information
     * @param artist Artist name
     * @param mbid Optional MusicBrainz ID
     */
    async getArtistInfo(artist: string, mbid?: string): Promise<any> {
        if (!artist) {
            throw new BadRequestException('Artist is required');
        }

        const params: Record<string, string> = {
            artist,
        };

        if (mbid) {
            params.mbid = mbid;
        }

        const response = await this.makeRequest('artist.getInfo', params);
        return response.artist;
    }

    /**
     * Search for tracks
     * @param query Search query
     * @param limit Number of results (default: 30, max: 30)
     * @param page Page number (default: 1)
     */
    async searchTracks(query: string, limit: number = 30, page: number = 1): Promise<any> {
        if (!query || query.trim().length === 0) {
            throw new BadRequestException('Search query cannot be empty');
        }

        const params: Record<string, string> = {
            track: query,
            limit: Math.min(limit, 30).toString(),
            page: page.toString(),
        };

        const response = await this.makeRequest('track.search', params);
        return response.results;
    }

    /**
     * Search for artists
     * @param query Search query
     * @param limit Number of results (default: 30, max: 30)
     * @param page Page number (default: 1)
     */
    async searchArtists(query: string, limit: number = 30, page: number = 1): Promise<any> {
        if (!query || query.trim().length === 0) {
            throw new BadRequestException('Search query cannot be empty');
        }

        const params: Record<string, string> = {
            artist: query,
            limit: Math.min(limit, 30).toString(),
            page: page.toString(),
        };

        const response = await this.makeRequest('artist.search', params);
        return response.results;
    }

    /**
     * Get top tracks for an artist
     * @param artist Artist name
     * @param limit Number of results (default: 50, max: 1000)
     * @param page Page number (default: 1)
     */
    async getArtistTopTracks(artist: string, limit: number = 50, page: number = 1): Promise<any> {
        if (!artist) {
            throw new BadRequestException('Artist is required');
        }

        const params: Record<string, string> = {
            artist,
            limit: Math.min(limit, 1000).toString(),
            page: page.toString(),
        };

        const response = await this.makeRequest('artist.getTopTracks', params);
        return response.toptracks;
    }

    /**
     * Get similar tracks
     * @param artist Artist name
     * @param track Track name
     * @param limit Number of results (default: 50, max: 1000)
     */
    async getSimilarTracks(artist: string, track: string, limit: number = 50): Promise<any> {
        if (!artist || !track) {
            throw new BadRequestException('Artist and track are required');
        }

        const params: Record<string, string> = {
            artist,
            track,
            limit: Math.min(limit, 1000).toString(),
        };

        const response = await this.makeRequest('track.getSimilar', params);
        return response.similartracks;
    }

    /**
     * Get recommendations to spice up a list of songs using Last.fm
     * Supports three diversity modes: strict, normal, diverse
     */
    async spiceUpPlaylist(request: LastfmSpiceUpRequestDto): Promise<LastfmSpiceUpResponseDto> {
        if (!request.songs || request.songs.length === 0) {
            throw new BadRequestException('At least one song is required');
        }

        const mode = request.mode || 'normal';
        const limit = Math.min(request.limit || 20, 100);

        // Get diversity settings based on mode
        const diversitySettings = this.getDiversitySettings(mode);

        // Search for each song and collect similar tracks
        const allSimilarTracks: Map<string, {
            name: string;
            artist: string;
            url: string;
            match: number;
            mbid?: string;
        }> = new Map();

        let foundSongs = 0;

        this.logger.debug(`Processing ${request.songs.length} songs for Last.fm spice-up with mode: ${mode}`);

        for (const song of request.songs) {
            try {
                // Build search query from available fields
                const searchTerms: string[] = [];
                if (song.name) searchTerms.push(song.name);
                if (song.artist) searchTerms.push(song.artist);
                if (song.album) searchTerms.push(song.album);

                if (searchTerms.length === 0) {
                    this.logger.warn('Skipping song with no searchable fields', song);
                    continue;
                }

                // Search for the track
                const searchQuery = searchTerms.join(' ');
                const searchResults = await this.searchTracks(searchQuery, 5, 1);

                const tracks = searchResults?.trackmatches?.track;
                if (tracks && (Array.isArray(tracks) ? tracks.length > 0 : true)) {
                    const foundTrack = Array.isArray(tracks) ? tracks[0] : tracks;
                    foundSongs++;

                    let foundSimilarTracks = false;

                    // Strategy 1: Try to get similar tracks for the found track
                    try {
                        const similarTracks = await this.getSimilarTracks(
                            foundTrack.artist,
                            foundTrack.name,
                            diversitySettings.similarTracksLimit,
                        );

                        if (similarTracks?.track) {
                            const similarTracksArray = Array.isArray(similarTracks.track)
                                ? similarTracks.track
                                : [similarTracks.track];

                            this.logger.debug(`Found ${similarTracksArray.length} similar tracks for ${foundTrack.artist} - ${foundTrack.name}`);

                            if (similarTracksArray.length > 0) {
                                foundSimilarTracks = true;
                                // Add similar tracks to the collection (deduplicate by name+artist)
                                similarTracksArray.forEach((track: any, index: number) => {
                                    const key = `${track.artist?.toLowerCase() || ''}_${track.name?.toLowerCase() || ''}`;
                                    if (!allSimilarTracks.has(key)) {
                                        allSimilarTracks.set(key, {
                                            name: track.name || '',
                                            artist: track.artist || '',
                                            url: track.url || '',
                                            match: track.match ? parseFloat(track.match) : 100 - index,
                                            mbid: track.mbid,
                                        });
                                    }
                                });
                            } else {
                                this.logger.debug(`Similar tracks array is empty for ${foundTrack.artist} - ${foundTrack.name}`);
                            }
                        } else {
                            this.logger.debug(`No similar tracks found in response for ${foundTrack.artist} - ${foundTrack.name}`);
                        }
                    } catch (error) {
                        this.logger.warn(
                            `Failed to get similar tracks for: ${foundTrack.artist} - ${foundTrack.name}`,
                            error,
                        );
                    }

                    // Strategy 2: If no similar tracks found, try artist's top tracks
                    if (!foundSimilarTracks && foundTrack.artist) {
                        try {
                            this.logger.debug(`Fallback: Getting top tracks for artist: ${foundTrack.artist}`);
                            const topTracks = await this.getArtistTopTracks(
                                foundTrack.artist,
                                diversitySettings.similarTracksLimit,
                                1,
                            );

                            if (topTracks?.track) {
                                const topTracksArray = Array.isArray(topTracks.track)
                                    ? topTracks.track
                                    : [topTracks.track];

                                // Filter out the original track and add others
                                topTracksArray.forEach((track: any, index: number) => {
                                    // Skip if it's the same track we searched for
                                    if (
                                        track.name?.toLowerCase() === foundTrack.name?.toLowerCase() &&
                                        track.artist?.name?.toLowerCase() === foundTrack.artist?.toLowerCase()
                                    ) {
                                        return;
                                    }

                                    const key = `${track.artist?.name?.toLowerCase() || ''}_${track.name?.toLowerCase() || ''}`;
                                    if (!allSimilarTracks.has(key)) {
                                        allSimilarTracks.set(key, {
                                            name: track.name || '',
                                            artist: track.artist?.name || track.artist || '',
                                            url: track.url || '',
                                            match: 0.5 - index * 0.01, // Lower match score for fallback
                                            mbid: track.mbid,
                                        });
                                    }
                                });
                            }
                        } catch (error) {
                            this.logger.warn(
                                `Failed to get top tracks for artist: ${foundTrack.artist}`,
                                error,
                            );
                        }
                    }

                    // Strategy 3: If still nothing, use search results directly (excluding the original)
                    if (allSimilarTracks.size === 0 || (!foundSimilarTracks && allSimilarTracks.size < 3)) {
                        try {
                            const searchTracksArray = Array.isArray(tracks) ? tracks : [tracks];
                            this.logger.debug(`Fallback: Using search results directly`);
                            
                            searchTracksArray.slice(1, diversitySettings.similarTracksLimit + 1).forEach((track: any, index: number) => {
                                // Skip the first one (it's the original)
                                const key = `${track.artist?.toLowerCase() || ''}_${track.name?.toLowerCase() || ''}`;
                                if (!allSimilarTracks.has(key)) {
                                    allSimilarTracks.set(key, {
                                        name: track.name || '',
                                        artist: track.artist || '',
                                        url: track.url || '',
                                        match: 0.4 - index * 0.01, // Even lower match score
                                        mbid: track.mbid,
                                    });
                                }
                            });
                        } catch (error) {
                            this.logger.warn('Failed to use search results as fallback', error);
                        }
                    }
                } else {
                    this.logger.warn(`No results found for: ${searchQuery}`);
                    
                    // Strategy 4: If search fails, try searching by artist only to get their top tracks
                    if (song.artist) {
                        try {
                            this.logger.debug(`Fallback: Searching by artist only: ${song.artist}`);
                            const artistTopTracks = await this.getArtistTopTracks(
                                song.artist,
                                diversitySettings.similarTracksLimit,
                                1,
                            );

                            if (artistTopTracks?.track) {
                                const topTracksArray = Array.isArray(artistTopTracks.track)
                                    ? artistTopTracks.track
                                    : [artistTopTracks.track];

                                topTracksArray.forEach((track: any, index: number) => {
                                    const key = `${track.artist?.name?.toLowerCase() || ''}_${track.name?.toLowerCase() || ''}`;
                                    if (!allSimilarTracks.has(key)) {
                                        allSimilarTracks.set(key, {
                                            name: track.name || '',
                                            artist: track.artist?.name || track.artist || '',
                                            url: track.url || '',
                                            match: 0.3 - index * 0.01,
                                            mbid: track.mbid,
                                        });
                                    }
                                });
                            }
                        } catch (error) {
                            this.logger.warn(`Failed to get artist top tracks for: ${song.artist}`, error);
                        }
                    }
                }
            } catch (error) {
                this.logger.warn(`Failed to search for song: ${JSON.stringify(song)}`, error);
            }
        }

        // If we still have no tracks, try a more aggressive fallback
        if (allSimilarTracks.size === 0) {
            this.logger.warn('No tracks found with primary strategies, trying aggressive fallback');
            
            // Try to get recommendations from popular artists/tracks as last resort
            for (const song of request.songs) {
                if (song.artist) {
                    try {
                        // Search for the artist and get their top tracks
                        const artistInfo = await this.getArtistInfo(song.artist);
                        if (artistInfo) {
                            const topTracks = await this.getArtistTopTracks(song.artist, 10, 1);
                            if (topTracks?.track) {
                                const topTracksArray = Array.isArray(topTracks.track)
                                    ? topTracks.track
                                    : [topTracks.track];
                                
                                topTracksArray.slice(0, 5).forEach((track: any, index: number) => {
                                    const key = `${track.artist?.name?.toLowerCase() || ''}_${track.name?.toLowerCase() || ''}`;
                                    if (!allSimilarTracks.has(key)) {
                                        allSimilarTracks.set(key, {
                                            name: track.name || '',
                                            artist: track.artist?.name || track.artist || '',
                                            url: track.url || '',
                                            match: 0.2 - index * 0.01,
                                            mbid: track.mbid,
                                        });
                                    }
                                });
                            }
                        }
                    } catch (error) {
                        this.logger.warn(`Aggressive fallback failed for artist: ${song.artist}`, error);
                    }
                }
            }
        }

        if (allSimilarTracks.size === 0) {
            throw new BadRequestException(
                'Could not find any tracks. Please check your song information and try different songs or artists.',
            );
        }

        // Convert to array and sort by match score (higher is better)
        let recommendations = Array.from(allSimilarTracks.values()).sort(
            (a, b) => b.match - a.match,
        );

        // Apply diversity filtering based on mode
        recommendations = this.applyDiversityFilter(recommendations, mode, limit);

        return {
            mode,
            inputSongs: request.songs.length,
            recommendations: recommendations.slice(0, limit),
            foundSongs,
        };
    }

    /**
     * Get diversity settings based on mode
     */
    private getDiversitySettings(mode: 'strict' | 'normal' | 'diverse'): {
        similarTracksLimit: number;
    } {
        switch (mode) {
            case 'strict':
                // Strict: Get fewer similar tracks per song (more focused)
                return { similarTracksLimit: 10 };
            case 'normal':
                // Normal: Balanced approach
                return { similarTracksLimit: 20 };
            case 'diverse':
                // Diverse: Get more similar tracks per song (more variety)
                return { similarTracksLimit: 50 };
        }
    }

    /**
     * Apply diversity filter to recommendations
     */
    private applyDiversityFilter(
        tracks: Array<{ name: string; artist: string; url: string; match: number; mbid?: string }>,
        mode: 'strict' | 'normal' | 'diverse',
        limit: number,
    ): Array<{ name: string; artist: string; url: string; match: number; mbid?: string }> {
        switch (mode) {
            case 'strict':
                // Strict: Take top matches only, prioritize high match scores
                return tracks.filter((t) => t.match >= 0.5).slice(0, limit);
            case 'normal':
                // Normal: Balanced selection, mix of high and medium matches
                const highMatches = tracks.filter((t) => t.match >= 0.3).slice(0, Math.floor(limit * 0.7));
                const mediumMatches = tracks.filter((t) => t.match >= 0.1 && t.match < 0.3).slice(0, Math.ceil(limit * 0.3));
                return [...highMatches, ...mediumMatches].slice(0, limit);
            case 'diverse':
                // Diverse: Include wider range of matches, more variety
                return tracks.slice(0, limit);
        }
    }

    /**
     * Get recommendations and optionally convert to Deezer IDs
     * This method requires DeezerService to be injected
     */
    async spiceUpPlaylistWithDeezer(
        request: LastfmSpiceUpRequestDto,
        deezerService?: any, // DeezerService injected from controller
        convertToDeezer: boolean = false,
    ): Promise<LastfmSpiceUpWithDeezerResponseDto> {
        // First, get Last.fm recommendations
        const lastfmResponse = await this.spiceUpPlaylist(request);

        const response: LastfmSpiceUpWithDeezerResponseDto = {
            mode: lastfmResponse.mode,
            inputSongs: lastfmResponse.inputSongs,
            foundSongs: lastfmResponse.foundSongs,
            recommendations: lastfmResponse.recommendations.map((rec) => ({
                ...rec,
                deezerId: undefined,
            })),
        };

        // If conversion is requested and DeezerService is available
        if (convertToDeezer && deezerService) {
            try {
                const tracksToConvert = lastfmResponse.recommendations.map((rec) => ({
                    name: rec.name,
                    artist: rec.artist,
                }));

                const deezerResults = await deezerService.convertTracksToDeezerIds(tracksToConvert);

                // Merge Deezer IDs into recommendations
                response.recommendations = lastfmResponse.recommendations.map((rec, index) => ({
                    ...rec,
                    deezerId: deezerResults[index]?.deezerId || null,
                }));

                response.deezerConversion = {
                    converted: deezerResults.filter((r) => r.deezerId !== null).length,
                    total: deezerResults.length,
                };
            } catch (error) {
                this.logger.error('Failed to convert to Deezer IDs', error);
                // Continue without Deezer IDs if conversion fails
            }
        }

        return response;
    }
}

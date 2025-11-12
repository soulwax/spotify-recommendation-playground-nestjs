import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { LastfmAuthService } from './auth/lastfm-auth.service';

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
    private async makeRequest(method: string, params: Record<string, string> = {}): Promise<any> {
        try {
            const queryParams = {
                method,
                ...params,
            };

            const queryString = this.authService.buildQueryString(queryParams);
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

    // Add Last.fm API methods here as needed
    // Example methods:
    // - getTrackInfo(artist: string, track: string)
    // - getArtistInfo(artist: string)
    // - searchTracks(query: string)
    // etc.
}


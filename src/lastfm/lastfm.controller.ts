import { Controller } from '@nestjs/common';
import { LastfmService } from './lastfm.service';

@Controller('api/lastfm')
export class LastfmController {
    constructor(private readonly lastfmService: LastfmService) {}

    // TODOAdd Last.fm endpoints here
    // E.g. get track info, get artist info, search tracks, etc.
    // @Get('track/info')
    // async getTrackInfo(
    //     @Query('artist') artist: string,
    //     @Query('track') track: string,
    // ) {
    //     return this.lastfmService.getTrackInfo(artist, track);
    // }
}


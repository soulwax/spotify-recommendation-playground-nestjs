import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LastfmController } from './lastfm.controller';
import { LastfmService } from './lastfm.service';
import { LastfmAuthService } from './auth/lastfm-auth.service';

@Module({
    imports: [HttpModule, ConfigModule],
    controllers: [LastfmController],
    providers: [LastfmService, LastfmAuthService],
    exports: [LastfmService],
})
export class LastfmModule {}


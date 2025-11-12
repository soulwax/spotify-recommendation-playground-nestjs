import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DeezerController } from './deezer.controller';
import { DeezerService } from './deezer.service';

@Module({
    imports: [HttpModule, ConfigModule],
    controllers: [DeezerController],
    providers: [DeezerService],
    exports: [DeezerService],
})
export class DeezerModule {}


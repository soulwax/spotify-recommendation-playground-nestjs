export class TrackToConvertDto {
    name: string;
    artist?: string;
}

export class ConvertToDeezerRequestDto {
    tracks: TrackToConvertDto[];
}

export class ConvertToDeezerResponseDto {
    converted: number;
    total: number;
    tracks: Array<{
        name: string;
        artist?: string;
        deezerId: number | null;
    }>;
}


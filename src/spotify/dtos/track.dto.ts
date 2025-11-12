// File: src/spotify/dtos/track.dto.ts

export class TrackDto {
    id: string;
    name: string;
    artists: Array<{ name: string; id: string }>;
    album: { name: string };
    popularity: number;
    preview_url: string | null;
    external_urls: { spotify: string };
}

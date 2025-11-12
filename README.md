<div align="center"><h1 style="font-size: 2.5em; margin-bottom: 0.5em;"><b>Songbird Player API</b></h1></div>

<div align="center"><img src=".github/resources/songbird.png" alt="Songbird Player" width="600" height="600" /></div>

## Overview

A NestJS REST API that integrates with both the **Spotify Web API** and **Last.fm API** to provide comprehensive music search, recommendations, and metadata services. The server acts as a proxy/wrapper around these APIs, adding token management, error handling, and structured response formats.

## API Routes

### Root Endpoint

#### `GET /`
- **Description**: Health check endpoint
- **Response**: `"Hello World!"`

---

### Spotify API Routes (`/api/spotify`)

#### `GET /api/spotify/search/tracks`
- **Description**: Search for tracks on Spotify
- **Query Parameters**:
  - `query` (required): Search query string
  - `limit` (optional): Number of results (default: 10)
- **Response**: Array of `TrackDto` objects
- **Example**: `GET /api/spotify/search/tracks?query=beatles&limit=5`

#### `GET /api/spotify/recommendations`
- **Description**: Get track recommendations based on seeds
- **Query Parameters**:
  - `seed_tracks` (optional): Comma-separated track IDs
  - `seed_artists` (optional): Comma-separated artist IDs
  - `seed_genres` (optional): Comma-separated genre names
  - `limit` (optional): Number of recommendations (default: 20, max: 100)
  - `market` (optional): ISO 3166-1 alpha-2 country code
  - `target_danceability` (optional): 0.0-1.0 (default: 0.5)
  - `target_popularity` (optional): 0-100 (default: 50)
- **Response**: `RecommendationResponseDto` with seeds and tracks
- **Note**: At least one seed (`seed_tracks`, `seed_artists`, or `seed_genres`) is required
- **Example**: `GET /api/spotify/recommendations?seed_tracks=4iV5W9uYEdYUVa79Axb7Rh&limit=10&target_danceability=0.7`

#### `POST /api/spotify/recommendations/from-search`
- **Description**: Get recommendations by searching for a track first
- **Request Body**:
  ```json
  {
    "query": "string",
    "limit": number (optional, default: 20)
  }
  ```
- **Response**: `RecommendationResponseDto` with seeds and tracks
- **Flow**: 
  1. Searches for tracks matching the query
  2. Uses the first result as a seed track
  3. Gets recommendations with default targets (danceability: 0.6, popularity: 60)
- **Example**:
  ```json
  POST /api/spotify/recommendations/from-search
  {
    "query": "bohemian rhapsody",
    "limit": 15
  }
  ```

---

### Last.fm API Routes (`/api/lastfm`)

#### `GET /api/lastfm/track/info`
- **Description**: Get detailed information about a track
- **Query Parameters**:
  - `artist` (required): Artist name
  - `track` (required): Track name
  - `mbid` (optional): MusicBrainz ID
- **Response**: Track information object
- **Example**: `GET /api/lastfm/track/info?artist=Radiohead&track=Creep`

#### `GET /api/lastfm/artist/info`
- **Description**: Get detailed information about an artist
- **Query Parameters**:
  - `artist` (required): Artist name
  - `mbid` (optional): MusicBrainz ID
- **Response**: Artist information object
- **Example**: `GET /api/lastfm/artist/info?artist=Radiohead`

#### `GET /api/lastfm/track/search`
- **Description**: Search for tracks on Last.fm
- **Query Parameters**:
  - `query` (required): Search query string
  - `limit` (optional): Number of results (default: 30, max: 30)
  - `page` (optional): Page number (default: 1)
- **Response**: Search results object with track matches
- **Example**: `GET /api/lastfm/track/search?query=creep&limit=10&page=1`

#### `GET /api/lastfm/artist/search`
- **Description**: Search for artists on Last.fm
- **Query Parameters**:
  - `query` (required): Search query string
  - `limit` (optional): Number of results (default: 30, max: 30)
  - `page` (optional): Page number (default: 1)
- **Response**: Search results object with artist matches
- **Example**: `GET /api/lastfm/artist/search?query=radiohead&limit=10&page=1`

#### `GET /api/lastfm/artist/top-tracks`
- **Description**: Get top tracks for an artist
- **Query Parameters**:
  - `artist` (required): Artist name
  - `limit` (optional): Number of results (default: 50, max: 1000)
  - `page` (optional): Page number (default: 1)
- **Response**: Top tracks object
- **Example**: `GET /api/lastfm/artist/top-tracks?artist=Radiohead&limit=20`

#### `GET /api/lastfm/track/similar`
- **Description**: Get tracks similar to a given track
- **Query Parameters**:
  - `artist` (required): Artist name
  - `track` (required): Track name
  - `limit` (optional): Number of results (default: 50, max: 1000)
- **Response**: Similar tracks object
- **Example**: `GET /api/lastfm/track/similar?artist=Radiohead&track=Creep&limit=20`

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Spotify API Configuration
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Last.fm API Configuration
LASTFM_API_KEY=your_lastfm_api_key
LASTFM_SHARED_SECRET=your_lastfm_shared_secret
LASTFM_APPLICATION_NAME=Songbird Player
LASTFM_REGISTERED_TO=your_lastfm_username

# Server Configuration
PORT=3000
NODE_ENV=development
```

All variables are validated on startup using Joi schema validation.

## Architecture & Flow

### 1. Application Bootstrap (`main.ts`)
- Entry point that creates the NestJS app
- Reads `PORT` from config (defaults to 3000)
- Fetches and logs Spotify bearer token on startup
- Starts the HTTP server

### 2. Module Structure

#### Root Module (`app.module.ts`)
- **ConfigModule**: Global config with Joi validation
  - Required: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `LASTFM_API_KEY`, `LASTFM_SHARED_SECRET`, `LASTFM_APPLICATION_NAME`, `LASTFM_REGISTERED_TO`
  - Optional: `PORT` (default: 3000), `NODE_ENV` (default: development)
- **HttpModule**: Axios for HTTP requests
- **SpotifyModule**: Feature module for Spotify functionality
- **LastfmModule**: Feature module for Last.fm functionality

#### Spotify Module (`spotify.module.ts`)
- Controllers: `SpotifyController`
- Providers: `SpotifyService`, `SpotifyAuthService`
- Exports: `SpotifyService` (for use in other modules)

#### Last.fm Module (`lastfm.module.ts`)
- Controllers: `LastfmController`
- Providers: `LastfmService`, `LastfmAuthService`
- Exports: `LastfmService` (for use in other modules)

### 3. Authentication

#### Spotify Authentication (`spotify-auth.service.ts`)
`SpotifyAuthService` handles OAuth 2.0 Client Credentials:
- Token caching: Stores access token in memory
- Expiration check: Refreshes if expired (with 60s buffer)
- Token request: Uses `client_id:client_secret` as Basic auth
- Logs bearer token on startup and when refreshed
- Returns: Access token for API requests

#### Last.fm Authentication (`lastfm-auth.service.ts`)
`LastfmAuthService` handles Last.fm API authentication:
- API signature generation: MD5 hash of sorted parameters + shared secret
- Query string builder: Adds API key, signature (for authenticated methods), and format
- Helper methods: Get API key, application name, and registered user from config

### 4. Business Logic

#### Spotify Service (`spotify.service.ts`)
- `searchTracks()`: Validates query, gets access token, calls Spotify Search API, maps to `TrackDto[]`
- `getRecommendations()`: Validates seeds, gets access token, builds query params, calls Recommendations API, maps to `RecommendationResponseDto`

#### Last.fm Service (`lastfm.service.ts`)
- `getTrackInfo()`: Gets detailed track information
- `getArtistInfo()`: Gets detailed artist information
- `searchTracks()`: Searches for tracks with pagination
- `searchArtists()`: Searches for artists with pagination
- `getArtistTopTracks()`: Gets top tracks for an artist
- `getSimilarTracks()`: Gets tracks similar to a given track

### 5. Data Transfer Objects (DTOs)

#### Spotify DTOs (`src/spotify/dtos/`)
- `TrackDto`: Track information
- `SearchTracksDto`: Search query parameters
- `RecommendationQueryDto`: Recommendation query parameters
- `RecommendationResponseDto`: Recommendation response structure

#### Last.fm DTOs (`src/lastfm/dtos/`)
- `TrackInfoDto`: Track information structure
- `ArtistInfoDto`: Artist information structure
- `LastfmSearchTrackDto`: Search track result
- `LastfmSearchResultDto`: Search results with pagination

## Request Flow Examples

### Spotify Request Flow
Example: `GET /api/spotify/search/tracks?query=beatles&limit=5`

1. Request hits `SpotifyController.searchTracks()`
2. Controller calls `SpotifyService.searchTracks()`
3. Service calls `SpotifyAuthService.getAccessToken()`
   - Checks cached token
   - If expired/missing, requests new token from Spotify
4. Service makes HTTP request to `https://api.spotify.com/v1/search`
5. Response is mapped to `TrackDto[]` and returned

### Last.fm Request Flow
Example: `GET /api/lastfm/track/info?artist=Radiohead&track=Creep`

1. Request hits `LastfmController.getTrackInfo()`
2. Controller calls `LastfmService.getTrackInfo()`
3. Service calls `LastfmAuthService.buildQueryString()`
   - Adds API key and generates query string
   - For read operations, signature is optional
4. Service makes HTTP request to `https://ws.audioscrobbler.com/2.0`
5. Response is returned as-is (Last.fm API returns JSON)

## Key Features

- **Dual API Integration**: Seamless integration with both Spotify and Last.fm APIs
- **Token Management**: 
  - Spotify: Automatic token caching and refresh
  - Last.fm: API signature generation for authenticated methods
- **Error Handling**: Comprehensive error handling with detailed logging
- **Validation**: 
  - Joi schema validation for environment variables
  - Input validation for all API endpoints
- **Modular Design**: Clean separation of concerns with feature modules
- **Type Safety**: Full TypeScript support with DTOs
- **Pagination Support**: Built-in pagination for Last.fm search endpoints
- **Rate Limiting Awareness**: Respects API limits and provides helpful error messages

## Dependencies

### Core
- `@nestjs/axios`: HTTP client for API requests
- `@nestjs/config`: Configuration management
- `@nestjs/common`, `@nestjs/core`: NestJS framework

### Validation & Configuration
- `joi`: Environment variable validation
- `class-validator` & `class-transformer`: DTO validation

### Utilities
- `rxjs`: Reactive programming (used by HttpService)
- `crypto`: Node.js crypto module (for Last.fm signature generation)

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   - Copy `.env.sample` to `.env` (if available)
   - Fill in all required API credentials

3. **Start the server**:
   ```bash
   npm run start:dev
   ```

4. **Access the API**:
   - Server runs on `http://localhost:3000` (or your configured PORT)
   - Health check: `GET http://localhost:3000/`
   - API routes: `http://localhost:3000/api/spotify/*` and `http://localhost:3000/api/lastfm/*`

## Development

- `npm run start:dev`: Start in watch mode
- `npm run build`: Build for production
- `npm run start:prod`: Run production build
- `npm run lint`: Run ESLint
- `npm test`: Run tests

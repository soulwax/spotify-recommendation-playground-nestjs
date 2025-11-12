// File: src/app.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getLandingPage(): string {
    const hostUrl = this.configService.get<string>('HOST_URL') ?? 'https://songbird.starchildmusic.com';
    const environment = this.configService.get<string>('NODE_ENV') ?? 'development';
    const port = this.configService.get<number>('PORT') ?? 3000;

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Songbird API</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
          Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        margin: 0;
        padding: 40px 20px;
        background: #10131a;
        color: #f9fafb;
        display: flex;
        justify-content: center;
      }
      main {
        max-width: 760px;
        width: 100%;
        background: #161b25;
        padding: 48px 56px;
        border-radius: 18px;
        box-shadow: 0 18px 35px rgba(0, 0, 0, 0.35);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      h1 {
        font-size: 2.4rem;
        margin-bottom: 18px;
        color: #f4f6fb;
      }
      p {
        line-height: 1.6;
        margin-bottom: 16px;
        color: #d5d9e3;
      }
      section {
        margin-top: 32px;
      }
      .highlight {
        background: rgba(59, 130, 246, 0.12);
        border-left: 3px solid #3b82f6;
        padding: 16px 18px;
        border-radius: 12px;
        margin-top: 24px;
      }
      a {
        color: #60a5fa;
        text-decoration: none;
        font-weight: 600;
      }
      a:hover {
        text-decoration: underline;
      }
      .metadata {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 16px;
        margin-top: 16px;
      }
      .metadata div {
        background: rgba(255, 255, 255, 0.04);
        padding: 12px 16px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.06);
      }
      .metadata span {
        display: block;
        font-size: 0.82rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: rgba(255, 255, 255, 0.48);
        margin-bottom: 6px;
      }
      footer {
        margin-top: 40px;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.48);
        text-align: center;
      }
      code {
        font-family: 'Fira Code', 'Courier New', Courier, monospace;
        font-size: 0.95rem;
        color: #facc15;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Songbird API</h1>
      <p>
        Songbird aggregates insights from Spotify, Last.fm, and Deezer into one
        streamlined API for music discovery and playlist generation. This service
        powers <a href="https://songbird.starchildmusic.com" target="_blank" rel="noopener">Songbird Player</a>
        with curated recommendations, token management, and consistent response shaping.
      </p>

      <section class="highlight">
        <h2>Get Started</h2>
        <p>
          Explore the REST endpoints in your browser via the
          <a href="/docs" target="_blank" rel="noopener">Swagger UI</a> or download the
          <a href="/openapi.yaml" download>OpenAPI YAML</a> for integration into your tooling.
        </p>
      </section>

      <section>
        <h2>Environment</h2>
        <div class="metadata">
          <div>
            <span>Environment</span>
            <strong>${environment}</strong>
          </div>
          <div>
            <span>Host</span>
            <strong>${hostUrl}</strong>
          </div>
          <div>
            <span>Port</span>
            <strong>${port}</strong>
          </div>
        </div>
      </section>

      <section>
        <h2>Integrations</h2>
        <p>
          The API wraps multiple third-party services with unified authentication and caching layers:
        </p>
        <ul>
          <li>Spotify Web API for track search and recommendations</li>
          <li>Last.fm for extended metadata and similarity lookups</li>
          <li>Deezer for cross-service playlist conversions</li>
        </ul>
      </section>

      <footer>
        &copy; ${new Date().getFullYear()} Songbird. Secure &mdash; served over HTTPS.
      </footer>
    </main>
  </body>
</html>`;
  }
}

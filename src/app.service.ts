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
    const year = new Date().getFullYear().toString();

    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Songbird API playground — explore music discovery endpoints across Spotify, Last.fm, and Deezer." />
    <title>Songbird API Playground</title>
    <style>
      :root {
        color-scheme: dark;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
          Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        margin: 0;
        padding: 40px 20px;
        background: #070a12;
        color: #f9fafb;
        display: flex;
        justify-content: center;
        min-height: 100vh;
        background-image: radial-gradient(circle at 20% 20%, rgba(96, 165, 250, 0.2), transparent 55%),
          radial-gradient(circle at 80% 10%, rgba(251, 191, 36, 0.13), transparent 50%),
          radial-gradient(circle at 50% 80%, rgba(99, 102, 241, 0.18), transparent 45%);
      }
      main {
        max-width: 920px;
        width: 100%;
        background: rgba(17, 24, 39, 0.86);
        backdrop-filter: blur(16px);
        padding: 56px 56px 70px;
        border-radius: 24px;
        box-shadow: 0 34px 90px rgba(15, 23, 42, 0.55);
        border: 1px solid rgba(148, 163, 184, 0.18);
        box-sizing: border-box;
      }
      h1 {
        font-size: 2.75rem;
        margin-bottom: 18px;
        color: #f8fafc;
      }
      p {
        line-height: 1.66;
        margin-bottom: 16px;
        color: #dbeafe;
      }
      section {
        margin-top: 36px;
      }
      .highlight {
        background: rgba(79, 70, 229, 0.18);
        border-left: 3px solid rgba(129, 140, 248, 0.7);
        padding: 20px 24px;
        border-radius: 20px;
        margin-top: 32px;
        box-shadow: inset 0 0 28px rgba(99, 102, 241, 0.1);
      }
      a {
        color: #93c5fd;
        text-decoration: none;
        font-weight: 600;
      }
      a:hover {
        text-decoration: underline;
      }
      .metadata {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 18px;
        margin-top: 18px;
      }
      .metadata div {
        background: rgba(148, 163, 184, 0.08);
        padding: 18px 20px;
        border-radius: 16px;
        border: 1px solid rgba(148, 163, 184, 0.16);
      }
      .metadata span {
        display: block;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: rgba(226, 232, 240, 0.55);
        margin-bottom: 6px;
      }
      footer {
        margin-top: 60px;
        font-size: 0.85rem;
        color: rgba(226, 232, 240, 0.55);
        text-align: center;
      }
      code {
        font-family: 'Fira Code', 'Courier New', Courier, monospace;
        font-size: 0.95rem;
        color: #facc15;
      }
      .playground {
        margin-top: 44px;
        background: rgba(8, 145, 178, 0.09);
        border-radius: 26px;
        padding: 36px 40px;
        border: 1px solid rgba(45, 212, 191, 0.22);
        position: relative;
        overflow: hidden;
      }
      .playground::after {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: radial-gradient(circle at 30% 20%, rgba(16, 185, 129, 0.14), transparent 55%),
          radial-gradient(circle at 70% 80%, rgba(6, 182, 212, 0.1), transparent 60%);
        opacity: 0.9;
      }
      .playground h2 {
        margin-top: 0;
        font-size: 2rem;
      }
      .playground p {
        margin-top: 6px;
      }
      .controls {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 24px;
        position: relative;
        z-index: 1;
      }
      .pill {
        background: rgba(148, 163, 184, 0.08);
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 999px;
        padding: 11px 20px;
        color: #e2e8f0;
        flex: 1;
        min-width: 180px;
      }
      .shuffle {
        background: rgba(13, 148, 136, 0.24);
        color: #5eead4;
        font-weight: 600;
        border: 1px solid rgba(13, 148, 136, 0.35);
        cursor: pointer;
        transition: transform 0.18s ease, box-shadow 0.18s ease;
      }
      .shuffle:hover {
        transform: translateY(-2px);
        box-shadow: 0 18px 38px rgba(13, 148, 136, 0.28);
      }
      .routes-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 18px;
        margin-top: 24px;
        position: relative;
        z-index: 1;
      }
      .route-card {
        background: rgba(15, 23, 42, 0.86);
        border-radius: 20px;
        border: 1px solid rgba(15, 118, 110, 0.28);
        padding: 20px 22px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        box-shadow: 0 24px 40px rgba(13, 148, 136, 0.22);
        transition: transform 0.18s ease, box-shadow 0.18s ease;
      }
      .route-card:hover {
        transform: translateY(-4px) scale(1.01);
        box-shadow: 0 28px 60px rgba(13, 148, 136, 0.3);
      }
      .route-card:focus-within {
        outline: 2px solid rgba(45, 212, 191, 0.6);
        outline-offset: 3px;
      }
      .method {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        padding: 4px 12px;
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        background: rgba(59, 130, 246, 0.22);
        color: #93c5fd;
      }
      .path {
        font-family: 'Fira Code', 'Courier New', Courier, monospace;
        font-size: 1.02rem;
        color: #f1f5f9;
        word-break: break-all;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.75rem;
        padding: 6px 10px;
        border-radius: 999px;
        border: 1px solid rgba(148, 163, 184, 0.2);
        background: rgba(15, 23, 42, 0.6);
        margin-right: 8px;
      }
      .route-card button {
        align-self: flex-start;
        border: none;
        border-radius: 999px;
        padding: 8px 15px;
        background: rgba(13, 148, 136, 0.22);
        color: #5eead4;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.18s ease;
      }
      .route-card button:hover,
      .route-card button:focus-visible {
        background: rgba(13, 148, 136, 0.35);
        outline: none;
      }
      .route-card pre {
        background: rgba(10, 12, 20, 0.9);
        border-radius: 16px;
        padding: 14px 16px;
        margin: 0;
        font-size: 0.86rem;
        color: #e2e8f0;
        max-height: 220px;
        overflow: auto;
        border: 1px solid rgba(15, 118, 110, 0.24);
      }
      .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: rgba(226, 232, 240, 0.72);
        position: relative;
        z-index: 1;
      }
      @media (max-width: 730px) {
        body {
          padding: 24px 12px;
        }
        main {
          padding: 34px 22px 40px;
        }
        .playground {
          padding: 28px 24px;
        }
      }
    </style>
  </head>
  <body>
    <main id="songbird-root">
      <h1>Songbird API Playground</h1>
      <p>
        Songbird orchestrates Spotify, Last.fm, and Deezer into one joyful API for music discovery and playlist experimentation.
        Dive in, mix endpoints, and watch recommendations bloom.
      </p>
      <section class="highlight">
        <h2>Get Started</h2>
        <p>
          Explore the REST API visually via the
          <a href="/docs" target="_blank" rel="noopener">Swagger UI</a>, download the
          <a href="/openapi.yaml" download>OpenAPI YAML</a>, or try the playful route cards below to craft requests.
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
      <section class="playground" id="playground">
        <h2>Route Playground</h2>
        <p>
          Filter, shuffle, and flip cards to discover endpoints. Each card reveals method, tags, and a JSON example when available.
        </p>
        <div class="controls">
          <input id="search-input" class="pill" type="search" placeholder="Search endpoints (spotify, recommendations, tracks...)" aria-label="Search endpoints" />
          <select id="tag-filter" class="pill" aria-label="Filter by tag">
            <option value="">All areas</option>
          </select>
          <button type="button" id="shuffle-button" class="pill shuffle" title="Shuffle route cards">Shuffle routes ✨</button>
        </div>
        <div class="routes-grid" id="routes-grid" aria-live="polite"></div>
        <div class="empty-state" id="empty-state" hidden>
          No routes match that vibe yet. Try another search or filter.
        </div>
      </section>
      <footer>
        &copy; ${year} Songbird · Served over HTTPS · Powered by music APIs and Prisma logging.
      </footer>
    </main>
    <script>
      const specUrl = '/openapi.json';
      const searchInput = document.getElementById('search-input');
      const tagFilter = document.getElementById('tag-filter');
      const routesGrid = document.getElementById('routes-grid');
      const emptyState = document.getElementById('empty-state');
      const shuffleButton = document.getElementById('shuffle-button');

      const methodStyles = {
        get: { bg: 'rgba(59, 130, 246, 0.22)', color: '#93c5fd' },
        post: { bg: 'rgba(156, 163, 175, 0.3)', color: '#f9fafb' },
        put: { bg: 'rgba(6, 182, 212, 0.25)', color: '#67e8f9' },
        patch: { bg: 'rgba(251, 191, 36, 0.25)', color: '#facc15' },
        delete: { bg: 'rgba(248, 113, 113, 0.25)', color: '#fca5a5' },
      };

      function createMethodPill(method) {
        const pill = document.createElement('span');
        const style = methodStyles[method.toLowerCase()] || methodStyles.get;
        pill.className = 'method';
        pill.style.background = style.bg;
        pill.style.color = style.color;
        pill.textContent = method.toUpperCase();
        return pill;
      }

      function renderTags(tags = []) {
        const fragment = document.createDocumentFragment();
        tags.forEach((tag) => {
          const chip = document.createElement('span');
          chip.className = 'chip';
          chip.innerHTML = '<span aria-hidden="true">#</span>' + tag;
          fragment.appendChild(chip);
        });
        return fragment;
      }

      function createCard(operation) {
        const card = document.createElement('article');
        card.className = 'route-card';
        card.setAttribute('tabindex', '0');
        card.dataset.tags = (operation.tags || []).join(',').toLowerCase();
        card.dataset.path = operation.path.toLowerCase();
        card.dataset.summary = (operation.summary || '').toLowerCase();

        const methodPill = createMethodPill(operation.method);
        const path = document.createElement('div');
        path.className = 'path';
        path.textContent = operation.path;

        const summary = document.createElement('p');
        summary.textContent = operation.summary || 'No summary provided yet.';

        const tags = document.createElement('div');
        tags.appendChild(renderTags(operation.tags || []));

        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.textContent = 'Peek example';

        const details = document.createElement('pre');
        details.textContent = JSON.stringify(operation.sample, null, 2);
        details.hidden = true;

        toggle.addEventListener('click', () => {
          const isHidden = details.hidden;
          details.hidden = !isHidden;
          toggle.textContent = isHidden ? 'Hide example' : 'Peek example';
        });

        card.append(methodPill, path, summary, tags, toggle, details);
        return card;
      }

      function filterAndRender(cards, searchTerm, tag) {
        const term = (searchTerm || '').trim().toLowerCase();
        const tagTerm = (tag || '').toLowerCase();
        let visibleCount = 0;

        cards.forEach((card) => {
          const matchesSearch =
            !term ||
            card.dataset.path.includes(term) ||
            card.dataset.summary.includes(term) ||
            card.dataset.tags.includes(term);

          const matchesTag = !tagTerm || card.dataset.tags.split(',').includes(tagTerm);
          const shouldShow = matchesSearch && matchesTag;
          card.hidden = !shouldShow;
          if (shouldShow) visibleCount += 1;
        });

        emptyState.hidden = visibleCount !== 0;
      }

      function shuffleCards(cards) {
        for (let i = cards.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [cards[i], cards[j]] = [cards[j], cards[i]];
        }
        routesGrid.innerHTML = '';
        cards.forEach((card) => routesGrid.appendChild(card));
      }

      function extractSample(operation) {
        const requestContent = operation.requestBody?.content?.['application/json'];
        if (requestContent?.example) {
          return requestContent.example;
        }
        if (requestContent?.examples) {
          const first = Object.values(requestContent.examples)[0];
          if (first && typeof first === 'object' && 'value' in first) {
            return first.value;
          }
        }
        if (Array.isArray(operation.parameters) && operation.parameters.length > 0) {
          return operation.parameters.reduce((accumulator, parameter) => {
            accumulator[parameter.name] = parameter.example ?? '<' + parameter.in + '>';
            return accumulator;
          }, {});
        }
        return { message: 'No sample payload available. Try this endpoint in Swagger UI.' };
      }

      async function loadRoutes() {
        try {
          const response = await fetch(specUrl);
          if (!response.ok) {
            throw new Error('Failed to load OpenAPI spec');
          }
          const spec = await response.json();
          const operations = [];
          const tagsSet = new Set();

          Object.entries(spec.paths || {}).forEach(([pathKey, methods]) => {
            Object.entries(methods).forEach(([methodKey, operation]) => {
              const operationTags = operation.tags || ['general'];
              operationTags.forEach((tag) => tagsSet.add(tag));

              operations.push({
                path: pathKey,
                method: methodKey,
                summary: operation.summary || operation.operationId || 'Untitled endpoint',
                tags: operationTags,
                sample: extractSample(operation),
              });
            });
          });

          const cards = operations.map(createCard);
          routesGrid.replaceChildren(...cards);

          const tagOptions = ['<option value="">All areas</option>'].concat(
            Array.from(tagsSet)
              .sort((a, b) => a.localeCompare(b))
              .map((tag) => '<option value="' + tag + '">' + tag + '</option>'),
          );
          tagFilter.innerHTML = tagOptions.join('');

          const applyFilters = () => filterAndRender(cards, searchInput.value, tagFilter.value);

          searchInput.addEventListener('input', () => applyFilters());
          tagFilter.addEventListener('change', () => applyFilters());
          shuffleButton.addEventListener('click', () => {
            shuffleCards(cards);
            applyFilters();
          });

          applyFilters();
        } catch (error) {
          routesGrid.innerHTML = '';
          emptyState.hidden = false;
          emptyState.innerHTML = 'We could not load the OpenAPI spec right now. Please refresh or visit <a href="/docs" target="_blank" rel="noopener">Swagger UI</a>.';
          console.error('Failed to load OpenAPI spec', error);
        }
      }

      loadRoutes();
    </script>
  </body>
</html>`;

    return html;
  }
}

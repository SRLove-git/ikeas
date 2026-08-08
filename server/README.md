# ikea-server

This website's backend, built with **Java 21 + Spring Boot 3.5**. It serves the
same crawled IKEA China data the Next.js frontend uses (categories, products,
content pages, homepage sections, menus), through a REST API — plus optional
serving of the repo's `public/` assets.

## Requirements

- JDK 21
- Maven 3.9+ (or use the bundled `./mvnw`)

## Quick start

```bash
cd server
./mvnw spring-boot:run
```

Or build and run the jar:

```bash
./mvnw -DskipTests package
java -jar target/ikea-server-0.1.0.jar
```

The API listens on `http://localhost:8080`. Verify with:

```bash
curl http://localhost:8080/api/v1/health
```

### Serving the site's images / fonts (optional)

Point the server at the repo's `public/` folder to also serve `/images/**`,
`/seo/**` and `/fonts/**`:

```bash
IKEA_STATIC_PUBLIC_DIR=../public java -jar target/ikea-server-0.1.0.jar
```

## Configuration (environment variables)

| Variable | Default | Description |
| --- | --- | --- |
| `SERVER_PORT` | `8080` | HTTP port |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:3001` | Comma-separated allowed origins |
| `IKEA_STATIC_PUBLIC_DIR` | *(empty)* | Path to the repo's `public/` dir to serve static assets |

## Data

All data lives in `src/main/resources/data/` and is bundled into the jar:

- `catalog.json` — catalog + channel categories with products
- `products/products-part-*.json` — product detail pages
- `catalog-pages.json` — category landing pages
- `pages/*.json` — crawled content pages (rooms, ideas, campaigns, ...)
- `legacy-pages.json` — legacy content pages that fill lookup gaps
- `homepage.json`, `menu-panels.json`, `menu-categories.json` — homepage & header data

After re-running the crawl scripts in the frontend (`scripts/crawl-*.mjs`),
regenerate the backend copy with:

```bash
node scripts/export-server-data.mjs
```

Lookup semantics (category slug matching, product slug/id precedence, page URL
normalization) intentionally mirror `src/lib/*.ts` in the Next.js app.

## API

All endpoints are under `/api/v1` and return JSON (UTF-8). Missing resources
return `404` with `{ "status": 404, "error": "Not Found", "message": ..., "path": ... }`.

### Health & stats

| Endpoint | Description |
| --- | --- |
| `GET /api/v1/health` | Service liveness |
| `GET /api/v1/stats` | Data counts (categories, pages, products) |

### Categories

| Endpoint | Description |
| --- | --- |
| `GET /api/v1/categories` | `{ catalogCategories, channelCategories }` |
| `GET /api/v1/categories/menu` | Header mega-menu categories |
| `GET /api/v1/categories/{slug}` | Category or sub-category match: `{ category, sub? }` |
| `GET /api/v1/categories/{slug}/products` | Paged products of the matched category (`page`, `size`) |

### Products

| Endpoint | Description |
| --- | --- |
| `GET /api/v1/products` | List/search. Params: `q`, `categorySlug`, `page`, `size` |
| `GET /api/v1/products/{id}` | Product by ID with breadcrumb category |
| `GET /api/v1/products/slug/{slug}` | Product by SEO slug with breadcrumb category |

### Pages

| Endpoint | Description |
| --- | --- |
| `GET /api/v1/pages?url=/cn/zh/rooms/bedroom/` | Single content page by URL |
| `GET /api/v1/pages?family=rooms` | All pages of a family |
| `GET /api/v1/pages?family=rooms&depth=1` | Pages whose path has exactly N segments |
| `GET /api/v1/pages?family=rooms&minDepth=1` | Pages deeper than N segments |
| `GET /api/v1/pages/families` | Family -> page count map |
| `GET /api/v1/catalog-pages` | All category landing pages (optional `q`) |
| `GET /api/v1/catalog-pages/{slug}` | One category landing page |

### Homepage & menus

| Endpoint | Description |
| --- | --- |
| `GET /api/v1/homepage` | Full homepage payload (notices, nav, hero, ranking, footer, ...) |
| `GET /api/v1/homepage/{section}` | One section, e.g. `heroSlides`, `rankingSections` |
| `GET /api/v1/menu-panels` | Header hover panels |

### Search

| Endpoint | Description |
| --- | --- |
| `GET /api/v1/search?q=床&limit=20` | Products + content pages + catalog pages |

## Docker

```bash
docker compose up server --build
```

Serves the API on port 8080 and mounts `./public` for static assets.

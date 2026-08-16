# ikea-server

This website's backend, built with **Java 21 + Spring Boot 3.5**. It serves the
same crawled IKEA China data the Next.js frontend uses (categories, products,
content pages, homepage sections, menus) through a REST API, and implements the
site's interactive features: **login/register (SMS + password)**, **shopping
bag**, **favorites**, and the **customer-service chat**. It can also serve the
repo's `public/` assets.

## Requirements

- JDK 21
- Maven 3.9+ (or use the bundled `./mvnw`)

## Quick start

```bash
cd backend
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
IKEA_STATIC_PUBLIC_DIR=../frontend/public java -jar target/ikea-server-0.1.0.jar
```

## Configuration (environment variables)

| Variable | Default | Description |
| --- | --- | --- |
| `SERVER_PORT` | `8080` | HTTP port |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:3001` | Comma-separated allowed origins |
| `IKEA_STATIC_PUBLIC_DIR` | *(empty)* | Path to the repo's `public/` dir to serve static assets |
| `IKEA_JWT_SECRET` | `change-me-to-a-long-random-secret-at-least-32-bytes` | HMAC secret used to sign access JWTs. Set a long random value outside local development. |
| `IKEA_ACCESS_TOKEN_TTL` | `900` | Access-token lifetime in seconds |
| `IKEA_REFRESH_TOKEN_TTL` | `2592000` | Refresh-token lifetime in seconds |
| `IKEA_EXPOSE_SMS_CODE` | `true` | Demo mode: return the SMS code in the API response |

### Demo account

The server seeds one account on startup:

- Account: `demo@ikea.cn` or phone `13800138000`
- Password: `123456`

First-time SMS logins auto-register the phone number.

## Data

Static content is bundled in `src/main/resources/data/` and used as the initial
seed for PostgreSQL:

- `catalog.json` — catalog + channel categories with products
- `products/products-part-*.json` — product detail pages
- `catalog-pages.json` — category landing pages
- `pages/*.json` — crawled content pages (rooms, ideas, campaigns, ...)
- `legacy-pages.json` — legacy content pages that fill lookup gaps
- `homepage.json`, `menu-panels.json`, `menu-categories.json` — homepage & header data

After re-running the frontend data export, regenerate the backend copy with:

```bash
node scripts/export-server-data.mjs
```

On first startup, Flyway creates the current schema (including `product`,
`catalog_category`, `menu_category`, `menu_panel`, `catalog_page`,
`content_page`, `homepage`, `cart_item`, and `chat_message`) and the
application seeds these content tables from the bundled JSON files. After that,
the REST API reads content from PostgreSQL via MyBatis-Plus. Shopping bag and
customer-service chat history are also persisted in PostgreSQL instead of
in-memory storage.

Lookup semantics (category slug matching, product slug/id precedence, page URL
normalization) intentionally mirror `src/lib/*.ts` in the Next.js app.

## API

All endpoints are under `/api/v1` and return JSON (UTF-8). Missing resources
return `404` with `{ "status": 404, "error": "Not Found", "message": ..., "path": ... }`.

### Admin (CMS)

Endpoints under `/api/v1/admin/**` are protected by the `X-Admin-Key` header
(config `ikea.admin.key`, env `IKEA_ADMIN_KEY`, default `ikea-admin`). The
Next.js admin panel proxies these through `/api/admin/server/**` so the key
never reaches the browser.

| Endpoint | Description |
| --- | --- |
| `GET /api/v1/admin/stats` | Counts: users, carts, favorites, chat messages |
| `GET /api/v1/admin/users` | All registered users |
| `DELETE /api/v1/admin/users/{id}` | Delete a user (also clears cart/favorites) |
| `GET /api/v1/admin/carts` | All non-empty shopping bags |
| `DELETE /api/v1/admin/carts/{userId}` | Clear a user's cart |
| `GET /api/v1/admin/favorites` | All favorite lists |
| `DELETE /api/v1/admin/favorites/{userId}` | Clear a user's favorites |
| `GET /api/v1/admin/chat/messages` | Customer-service chat history |
| `DELETE /api/v1/admin/chat/messages` | Clear chat history |
| `GET /api/v1/admin/orders` | All orders with user and item summaries |
| `GET /api/v1/admin/orders/{orderNo}` | One order |
| `PUT /api/v1/admin/orders/{orderNo}` | Update order status, shipping fields, or delivery fee |
| `DELETE /api/v1/admin/orders/{orderNo}` | Soft-delete an order and its items |

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

`GET /api/v1/products` and `/search` now match category names too (the same
semantics as the frontend search page) and return a `categoryNames` array on
each matched product.

### Auth (Bearer token)

| Endpoint | Description |
| --- | --- |
| `POST /api/v1/auth/sms/send` | `{ phone }` → sends a code (returned as `devCode` in demo mode) |
| `POST /api/v1/auth/sms/login` | `{ phone, code }` → logs in or auto-registers |
| `POST /api/v1/auth/login` | `{ account, password }` → password login |
| `POST /api/v1/auth/register` | `{ account, password, name? }` → creates an account |
| `POST /api/v1/auth/refresh` | `{ refreshToken }` → rotates the refresh token and returns a new access token |
| `GET /api/v1/auth/me` | Current user (requires `Authorization: Bearer <token>`) |
| `POST /api/v1/auth/logout` | Invalidates the token |

Successful login/register/SMS-login responses contain:

```json
{
  "token": "<jwt access token>",
  "refreshToken": "<opaque refresh token>",
  "expiresIn": 900,
  "tokenType": "Bearer",
  "user": {
    "id": "2088261458649227265",
    "name": "BUZUD 体验用户",
    "phone": "13800138000",
    "email": "demo@ikea.cn",
    "createdAt": "2026-08-14T13:48:24.420759"
  }
}
```

### Shopping bag & favorites (require auth)

| Endpoint | Description |
| --- | --- |
| `GET /api/v1/cart` | Cart with product snapshots, quantity and total price |
| `POST /api/v1/cart/items` | `{ productId, quantity }` add/merge |
| `PATCH /api/v1/cart/items/{productId}` | `{ quantity }` set quantity (`0` removes) |
| `DELETE /api/v1/cart/items/{productId}` | Remove one item |
| `DELETE /api/v1/cart` | Empty the bag |
| `GET /api/v1/favorites` | Favorite product ids + products |
| `POST /api/v1/favorites` | `{ productId }` add |
| `DELETE /api/v1/favorites/{productId}` | Remove |

### Orders (require auth)

The checkout page submits the current shopping bag as an order. The backend
stores the order in PostgreSQL and returns a stable `orderNo`.

| Endpoint | Description |
| --- | --- |
| `POST /api/v1/orders` | Create an order. Use `{ "fromCart": true, ... }` to clear the bag after success, or pass `items` explicitly. |
| `GET /api/v1/orders` | Current user's orders, newest first |
| `GET /api/v1/orders/{orderNo}` | One order owned by the current user |
| `POST /api/v1/orders/{orderNo}/cancel` | Cancel a pending-payment order |
| `POST /api/v1/orders/{orderNo}/refund` | Request a refund for a paid/shipped/completed order |

### Customer-service chat

| Endpoint | Description |
| --- | --- |
| `POST /api/v1/chat/messages` | `{ message }` → canned reply (delivery/returns/stores/membership/prices) |

## Docker

```bash
docker compose up server --build
```

Serves the API on port 8080 and mounts `./public` for static assets.

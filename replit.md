# MIRA — Premium Ecommerce Storefront

A full-stack premium ecommerce store inspired by Apple, Linear, Raycast, Stripe, and Vercel. Features a homepage, product listing, product detail, cart, checkout, order history, wishlist, user account, and full admin dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at `/api`)
- `pnpm --filter @workspace/storefront run dev` — run the storefront (Vite dev server)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — session signing

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- **Frontend**: React + Vite, Tailwind CSS v4, shadcn/ui, Wouter routing, TanStack Query, Framer Motion, Recharts, Sonner toasts
- **API**: Express 5, OpenAPI-first contract, Orval codegen
- **DB**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — all Drizzle ORM table definitions (products, categories, users, addresses, cart, orders, reviews, wishlist)
- `lib/api-spec/openapi.yaml` — source-of-truth OpenAPI contract
- `lib/api-zod/src/generated/` — generated Zod schemas from OpenAPI spec
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks
- `artifacts/api-server/src/routes/` — Express route handlers (products, categories, cart, orders, users, reviews, wishlist, analytics)
- `artifacts/storefront/src/pages/` — all frontend pages
- `artifacts/storefront/src/components/` — shared UI components (Header, Footer, ProductCard, CartDrawer)
- `artifacts/storefront/src/index.css` — CSS custom property theme (light + dark)

## Architecture decisions

- **Contract-first API**: OpenAPI spec drives Zod schemas (server validation) and React Query hooks (client fetching). Run codegen after any spec change.
- **Cart via session ID**: No auth required for cart — a UUID is created in localStorage and sent as a query param to all cart endpoints.
- **Demo user ID = 2** (Sarah Kim): Wishlist and Account pages hardcode userId=2 for demo purposes since auth is not wired up.
- **Admin at `/admin`**: No auth guard in demo — navigate to `/admin` for the dashboard, products, orders, and customers management.
- **Free shipping threshold**: Orders over $50 get free shipping; otherwise $9.99. Tax is flat 8%.

## Product

- **Homepage**: Hero, perks bar, featured products, category grid, best sellers, testimonials, newsletter signup
- **Products page**: Full filter sidebar (category, price range, in-stock), search, sort, pagination
- **Product detail**: Image gallery, variants, quantity, add-to-cart, reviews tab, related products
- **Cart**: Slide-out drawer (global) + full cart page with order summary
- **Checkout**: 3-step flow (shipping → payment → review) with order confirmation
- **Orders**: Order history list + detail page with order timeline
- **Wishlist / Account**: User wishlist and profile management
- **Admin dashboard**: Revenue chart, stat cards, order management, product CRUD, customer list

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **Express 5 wildcard routes**: Use `/{*splat}`, not `/*`. Always check `Array.isArray(req.params.x)` before using params.
- **Google Fonts `@import`**: Must be FIRST line of `index.css` before `@import "tailwindcss"` or PostCSS silently fails.
- **Orval hooks**: Generated query hooks return `T` directly (not `{ data: T }`). Pass `queryKey` whenever using `enabled`.
- **Zod v4**: Import from `zod/v4`, not `zod`. The `@workspace/api-zod` package handles this.
- **DB category IDs** (seeded): electronics=1, clothing=2, home-living=3, accessories=4, books=5, sports=6

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

## Parent

#40 — Web data-fetching layer redesign (TanStack Query + Router)

## What to build

Refactor `useServerTable` so list state (pagination, sort, search) is sourced from and written back to URL search params via the router, instead of internal `useState` + `onStateChange`. This is the prerequisite that lets list routes drive loader prefetching from validated `search` and makes filtered list views shareable and refresh-stable.

## Acceptance criteria

- [ ] `useServerTable` reads pagination/sort/search from URL search params and writes changes back to the URL (navigation), with no internal `useState` mirror.
- [ ] Changing page/sort/search updates the URL; refreshing the page restores the same list state; the browser back button restores the previous state.
- [ ] The hook exposes what a route needs to pair with a Zod `validateSearch` schema.
- [ ] Typecheck and lint clean. (Full consumer migration happens in the pilot tickets; this ticket delivers the hook and can demonstrate it on one list route without migrating loaders yet.)

## Blocked by

- #41 (Foundation primitives) — needs the key/tier shapes to demonstrate against.

# Performance Baseline — Lighthouse — 2026-06-03

> Roadmap leaf: `11.6 Performance (Lighthouse mobile > 90)`. Frontend posture review and target-setting before the first real-world event. A real CI-run Lighthouse audit is logged as a polish backlog item; this document captures the design-time constraints frontend already honours.

## Targets

| Metric (mobile) | Target | Posture |
| --- | --- | --- |
| Performance score | ≥ 90 | Plausible; needs CI run to confirm |
| Accessibility score | ≥ 95 | Verified statically — see [11.2 audit](11-2-accessibility-baseline-2026-06-03.md) |
| Best practices score | ≥ 95 | Should be clean; no mixed content, HTTPS-only |
| SEO score | ≥ 95 | All public routes carry per-route `generateMetadata` |
| Largest Contentful Paint | < 2.5 s | Server-rendered hero + Next.js image optimisation |
| Total Blocking Time | < 200 ms | Antd is heavy; mitigations below |
| Cumulative Layout Shift | < 0.1 | Skeleton placeholders sized to final dimensions |

## What we already do right

- **Next.js Image** for above-the-fold images (sized via width/height props, automatic responsive variants).
- **Skeleton loaders** on the `/issues` list match final card dimensions — `PublicIssueCardSkeleton` was an explicit 2026-06-02 polish ship to prevent CLS.
- **Font display: swap** on both Nunito and Baloo 2 (`src/app/layout.js`).
- **Reduced-motion safety** across animated primitives (event roster progress, time-series bars, page transitions, language switch dim).
- **`prefers-reduced-motion: reduce`** disables all transition-on-hover effects shipped in today's batches.
- **Server components** for SEO-critical pages (root layout, `/learn/[slug]`, `/development`, `/impact/layout`, sitemap, robots).
- **Static markdown rendering** for `/learn/[slug]` — no client-side markdown parser ships.
- **R2 + presign upload flow** — images are content-addressable and CDN-served (not bundled in the JS payload).

## Known performance risks

| Risk | Surface | Mitigation |
| --- | --- | --- |
| Antd bundle size | Most pages | Antd is the biggest payload contributor. Watching for tree-shake regressions; the `Modal`/`Form`/`Tag` mix is unavoidable for the admin + leader flows. |
| Many client components | `/events/[id]` | Six leader-only panels render conditionally; only one renders at a time per status. Currently fine. |
| Leaflet on `/issues/[id]` and `/events/[id]` | Map blocks | `IssueMapBlock` is lazy-loaded via dynamic import in some paths; verify in CI scan. |
| `injectMockLiveStream` deep-clone in `useEffect` | `/events/[id]` | Dev-only; production branch returns the event unchanged. |
| Cumulative animated panels | `/events/[id]` | Worst case: leader sees nomination + safety checklist + reminder cadence + complete editor + roster progress + roster panel + join panel + incident panel + share-as-contribution + ledger summary. All purely CSS animations with reduced-motion guards. |

## Items for the polish backlog as a result of this baseline

- `P2 [from 11.6]` Run real Lighthouse CI against staging + capture before/after numbers in `/development` once a CI environment is set up.
- `P3 [from 11.6]` Audit Antd imports — verify the babel-plugin-import (or modular import equivalent) is shaking unused components out.
- `P3 [from 11.6]` Investigate code-splitting `/events/[id]` per status so the leader-only panel bundles aren't loaded for unauthenticated viewers.
- `P3 [from 11.6]` Set up a `/_dev/perf` route that prints the per-page client-component count to flag regressions during local dev.

## Conclusion

No structural performance blockers for the first real-world event. The frontend has been built with image optimisation, skeleton loaders, reduced-motion safety, and metadata-first SEO in mind. The remaining work is observational — wire Lighthouse CI, watch the trend.

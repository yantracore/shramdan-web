/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // 2026-06-18 — the standalone /app-development App Dev Tasks board was
      // retired in favour of /discussions (the live, participatory
      // build-Shramdan surface the nav "App Development · LIVE" entry points
      // to). The page code (+ /new, /[slug], appDevStub, contract) is kept in
      // the repo so the move is reversible; these temporary (307) redirects
      // just retire it from the user-facing app. See
      // docs/ops/00-polish-backlog.md.
      { source: "/app-development", destination: "/discussions", permanent: false },
      { source: "/app-development/:path*", destination: "/discussions", permanent: false },

      // 2026-06-24 — Issues + Events LIST pages merged into the unified list at
      // /campaigns (plural). Only the list routes redirect; /issues/new,
      // /issues/:id and /events/:id stay where they are (the single-campaign
      // detail page /campaign/:slug ships in Phase 4, at which point the
      // /issues/:slug and /events/:slug detail redirects get added here).
      // 2026-06-26 — list is plural /campaigns; the singular bare /campaign is
      // reserved for the detail route, so /campaign with no slug redirects to
      // the list. Temporary (307) keeps the move reversible.
      { source: "/issues", destination: "/campaigns", permanent: false },
      { source: "/events", destination: "/campaigns", permanent: false },
      { source: "/campaign", destination: "/campaigns", permanent: false }
    ];
  }
};

export default nextConfig;

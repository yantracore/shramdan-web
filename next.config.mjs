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
      // /campaigns (plural). 2026-06-26 — the singular bare /campaign is
      // reserved for the detail route, so /campaign with no slug redirects to
      // the list. 2026-07-02 — the old /issues and /events page files (list +
      // detail) were DELETED from the repo, so these redirects flipped to
      // permanent (308): they are now the only thing serving those URLs.
      { source: "/issues", destination: "/campaigns", permanent: true },
      { source: "/events", destination: "/campaigns", permanent: true },
      { source: "/campaign", destination: "/campaigns", permanent: false },

      // 2026-06-29 — Phase 4: the unified single-campaign detail page ships at
      // /campaign/:slug (one design for every lifecycle status). The old per-
      // kind detail routes redirect to it. The canonical id is the ISSUE
      // slug; an event slug is NOT an issue slug, so /campaign/:slug resolves
      // either (issue first, then the event's linked issue). The `new` exclusion
      // keeps the issue reporter (/issues/new) reachable — without it the :slug
      // pattern would swallow it. Permanent (308) since 2026-07-02: the old
      // detail page files are deleted.
      {
        source: "/issues/:slug((?!new$).*)",
        destination: "/campaign/:slug",
        permanent: true
      },
      { source: "/events/:slug", destination: "/campaign/:slug", permanent: true }
    ];
  }
};

export default nextConfig;

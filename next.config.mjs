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
      { source: "/app-development/:path*", destination: "/discussions", permanent: false }
    ];
  }
};

export default nextConfig;

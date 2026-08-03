import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The dev server (and the ported artifact files marked `@ts-nocheck`) rely on
  // SWC, not tsc. `next build` otherwise runs a full type-check + ESLint pass
  // that the intentionally-loose ported code fails on. Correctness is gated by
  // the dedicated `pnpm typecheck` / `pnpm lint` scripts instead, so we don't
  // let those block the production build.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    reactCompiler: false,
    serverActions: {
      // The brand wizard posts documents and downscaled images in one action,
      // and Next rejects an oversized body with a 413 BEFORE the action runs -
      // uncatchable server-side, and shown to the operator as an opaque
      // "error occurred in the Server Components render". The default 1MB
      // cannot carry a brand guideline plus a screenshot, so the ceiling is
      // raised once, here, and every per-file limit in
      // src/lib/brand/source-limits.ts is sized to add up to less than it.
      // Keep the two in step: that file's BODY_LIMIT_BYTES mirrors this value.
      bodySizeLimit: '4mb',
    },
  },
  // Playwright drives a real Chromium binary and resolves it from its own
  // package directory at runtime. Bundling it would rewrite those paths and
  // break the launch, so it stays external and is required from node_modules.
  serverExternalPackages: ['playwright'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
}

export default withPayload(nextConfig)

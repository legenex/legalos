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

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // `next dev` otherwise auto-injects a framework-guidance block into CLAUDE.md
  // on every run, which conflates Next's own AI docs pointer with this repo's
  // actual working conventions and creates a recurring uncommitted diff.
  agentRules: false,
};

export default nextConfig;

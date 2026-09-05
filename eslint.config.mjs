import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/playwright-report/**",
      "**/test-results/**",
      "**/coverage/**",
      // Nested agent worktrees (Agent tool isolation:"worktree") — each is its
      // own git checkout under .claude/worktrees/, never lint it from here.
      ".claude/**",
    ],
  },
];

export default eslintConfig;

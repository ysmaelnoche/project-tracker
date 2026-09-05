import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest's config doesn't enable `globals: true` (every test file imports
// describe/it/expect explicitly instead), so @testing-library/react's
// automatic per-test cleanup — which relies on detecting a global
// `afterEach` — never registers on its own. Without this, component tests
// across `it()` blocks in the same file accumulate DOM from every previous
// render instead of starting fresh.
afterEach(() => {
  cleanup();
});

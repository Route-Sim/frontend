---
title: "Vitest Setup"
summary: "Initializes DOM matchers and provides stable in-memory storage for tests."
source_paths:
  - "tests/setup.ts"
last_updated: "2026-01-16"
owner: "Mateusz Nędzi"
tags: ["tests", "infrastructure", "vitest"]
links:
  parent: "../../SUMMARY.md"
  siblings: []
---

# Vitest Setup

> **Purpose:** Bootstraps the Vitest environment with DOM matchers and a storage polyfill so HUD and controller tests behave like a browser, even on runtimes without native Web Storage.

## Context & Motivation

- Tests rely on `localStorage` and `sessionStorage` to cache playback settings.
- Newer Node versions and Bun runs may expose incomplete storage shims, causing `localStorage.clear` failures.
- Happy DOM provides a browser-like environment but still benefits from a consistent fallback.

## Responsibilities & Boundaries

- In-scope: registering `@testing-library/jest-dom` matchers and ensuring Web Storage APIs exist.
- Out-of-scope: configuring individual test suites or mocking network calls.

## Architecture & Design

- Defines a lightweight `MemoryStorage` that satisfies the `Storage` interface using an internal `Map`.
- `ensureStorage` installs the polyfill when a runtime-provided storage object is missing or lacks `clear`.
- Applies the shim to both `localStorage` and `sessionStorage` to match browser behavior.

```43:44:tests/setup.ts
ensureStorage('localStorage');
ensureStorage('sessionStorage');
```

## Implementation Notes

- The shim is intentionally minimal: string-only values, predictable `key()` ordering, and no persistence to disk.
- Uses `Object.defineProperty` to mirror non-writable global storage bindings while remaining configurable for future overrides.

## Tests

- Covered implicitly by HUD/playback test suites that perform `localStorage.clear`, read/write, and JSON parsing.

## References

- Vitest configuration: `vitest.config.ts` (sets `happy-dom` environment and points to this setup file).

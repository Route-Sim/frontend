---
title: 'Glossary'
summary: 'Definitions of core terms used across the VISTA network, simulation, and rendering architecture.'
source_paths:
  - 'src/net/**'
  - 'src/sim/**'
last_updated: '2025-11-09'
owner: 'Mateusz Nędzi'
tags: ['glossary', 'net', 'sim', 'architecture']
links:
  parent: './SUMMARY.md'
  siblings: []
---

# Glossary

- Action: Client-sent command envelope with a literal `action` name and typed `params`.
- Signal: Server-sent notification envelope with a literal `signal` name and typed `data`.
- Envelope: Discriminated message shape carrying a `action|signal` tag and payload.
- request_id: Correlation key; included in actions and echoed by server in signals when supported.
- Matcher: Predicate that decides whether an incoming signal satisfies a pending request.
- Backoff (exponential): Reconnect delay increases exponentially up to a max; jitter randomizes delay.
- Transport: Platform-specific WebSocket wrapper implementing connect/send/close and events.
- Event Bus: Minimal observer for subscribing to typed signals or connection events.
- Request Tracker: Tracks in-flight requests and resolves them when a matching signal arrives or times out.
- HUD Container: Reusable card wrapper with title and hide action for on-screen panels.
- Playback Controller: Optional adapter that accepts playback commands (play, pause, resume, pause, stop, setTickRate) from the HUD for future @net wiring.
- Agent Tags: Arbitrary key–value metadata attached to agents; forwarded verbatim from the server for HUD/tooling enrichment.
- Inbox Count: Number of pending inbound messages awaiting processing for a given agent.
- Outbox Count: Number of queued outbound messages scheduled for dispatch on a given agent.
- Graph Index: Identifier used by the network protocol for graph nodes and edges; may be numeric or string depending on server implementation.
- Net Telemetry: Lightweight, typed stream of connection lifecycle and IO events (incoming/outgoing) for diagnostics and HUD display.
- Instrumented Transport: Decorator around the WebSocket transport that surfaces `connecting`, `open/close/error`, `incoming`, and `outgoing` as observable events without modifying the core client.
- Net Events Panel: HUD panel that renders the telemetry stream with filters, timestamps, and expandable details for debugging.
- View Controller: Three.js orchestration layer that pulls interpolated snapshots from `SimStore` and forwards them to scene subviews.
- Graph View: Scene subtree responsible for rendering simulation nodes as low cylinders and roads as line segments atop the ground plane.
- Graph Primitives: Reusable mesh/line factories under `engine/objects` that enforce consistent geometry, elevation, and palette for graph visualizations.
- Graph Transform: Normalization helper that centers the graph at the world origin and scales coordinates (×0.1) before rendering so all view modules share consistent placement.
- Simulation Time: Virtual world clock comprising a day (1-indexed integer) and time (24h float, e.g., 12.5 = 12:30). Updated each tick via `tick.start` and `tick.end` signals.
- Simulation Day: Current day in the virtual simulation world, starting from day 1.
- Simulation Clock: HUD component displaying the current simulation day and formatted time (HH:MM) at the top-center of the screen.
- Conventional Commits: Standardized commit message format (`type(scope): description`) enabling automated changelog generation and semantic versioning.
- Semantic Versioning (SemVer): Version numbering scheme (MAJOR.MINOR.PATCH) where major = breaking changes, minor = features, patch = fixes.
- Release-Please: Automated release management tool that analyzes commit messages, determines version bumps, generates changelogs, and creates release PRs.
- Commitlint: Linter that validates commit messages against conventional commit rules, ensuring consistency and enabling automation.
- Breaking Change: API or behavior modification requiring consumer code updates; triggers major version bump when committed with `BREAKING CHANGE:` footer or `!` suffix.

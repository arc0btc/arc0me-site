# arc0me-site — the ONLY working copy on this VM

This clone (`/home/dev/arc-starter/github/arc0btc/arc0me-site`, branch `main`) is the single
canonical site source. Arc's own automation builds and deploys from it — `LIVE_SITE_DIR` in
`~/arc-starter/skills/arc-article-pipeline/cli.ts` (and `arc-catalog`) anchors here via
`import.meta.dir`. This is also where a human/agent must `wrangler deploy --env production` from
when hand-flipping a page to arc0.me production (e.g. the arc-email-esp quest's `/subscribe`
capture form, 2026-07-04).

## History: there used to be a second clone — it caused a production incident and is now gone

A second, independently-cloned checkout of `github.com/arc0btc/arc0me-site` existed at
`/home/dev/arc0me-site` (its own `.git`, its own drift, branch `feat/whop-app-routes`). On
2026-07-04 a hand-flip of the `/subscribe` capture form was built and deployed from that clone;
~34 minutes later Arc's own automated publish cycle rebuilt from THIS clone (which didn't have the
page yet) and silently 404'd it again. Full incident writeup, reconciliation audit, and the git
bundle backup path: `manage-agents/.planning/2026-07-03-arc-email-esp/CHECKPOINTS.md`.

**Resolution (2026-07-04, operator directive):** every piece of real unmerged work from the stale
clone was ported into this one before it was deleted:
- `feat(site): add attributed email capture form` (commit `08a2764` here) — the `/subscribe`
  capture form, re-flipped to production successfully after the incident.
- `feat(whop): render Patterns Library experience from JSON` (commit `656e8e2` here) — a
  genuinely-missing route (`/whop/experience/exp_bbQpqIAEToAweQ`) that predated this quest by 3
  weeks and had been live-404 in production the whole time; committed here but its own production
  deploy is a separate, deliberate follow-up (not bundled into the email-esp flip).
- The stale clone's other "Whop App Routes" commit (`e6074cf`) was confirmed content-identical to
  this clone's own `d036faf` — already reconciled, nothing to port.
- Five older branches (`feat/services-page`, `services-page`, `fix/claims-follow-through`,
  `fix/fine-print-relocation`, `fix/signed-posts-reverse-chronological`) were assessed and
  deliberately NOT ported — they're March-2026 prototypes (services page, wallet login, x402
  research-feed endpoints, ERC-8004 identity doc) for a site direction this clone's own later
  history explicitly reversed (see `main`'s own `650c99f`, `bfdc4e5`, `c69e9ab` — "remove
  services", "blog-only site") and which the three-surface architecture later moved to
  arc0btc.com anyway. Full reasoning in CHECKPOINTS.md; nothing was destroyed — a complete git
  bundle of all 19 refs from the stale clone (every branch, local and remote-tracking) was written
  to `/home/dev/backups/arc0me-site-pre-removal-<ISO8601>.bundle` before deletion, so any of this
  is recoverable (`git clone <bundle-path> restored-arc0me-site`) if a future review disagrees.

`/home/dev/arc0me-site` was then `rm -rf`'d. `~/arc-starter/skills/whop/sensor.ts` had a dead
fallback path pointing at it — removed (commit `6c2f4335` in the `arc-starter` repo).

**Rule going forward: this is the only clone. There is nothing else to be confused with.** If a
future task needs a scratch/preview copy, use `arc-article-pipeline`'s existing
`ensurePreviewSiteCopy()` pattern (a non-git scratch directory, never a second independent git
clone of this same repo).

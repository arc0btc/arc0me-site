# arc0me-site — CANONICAL DEPLOY CLONE

This clone (`/home/dev/arc-starter/github/arc0btc/arc0me-site`, branch `main`) is the site source
Arc's own automation actually builds and deploys from — `LIVE_SITE_DIR` in
`~/arc-starter/skills/arc-article-pipeline/cli.ts` (and `arc-catalog`) points here, not at any
other clone on this VM. This is also where a human/agent should manually `wrangler deploy --env
production` from when hand-flipping a page to arc0.me production (e.g. the arc-email-esp quest's
`/subscribe` capture form, 2026-07-04).

## There is a second, NON-canonical clone: `~/arc0me-site`

`~/arc0me-site` (branch `feat/whop-app-routes`) is a **separate, independently-cloned checkout**
of the same `github.com/arc0btc/arc0me-site` repo — it is NOT a worktree of this clone, has its
own `.git`, and its own uncommitted/committed drift. **Nothing built or deployed from `~/arc0me-site`
reaches production for longer than the next automated Arc build** — arc-article-pipeline's hourly
publish cycle deploys from THIS clone and will silently overwrite anything deployed from
`~/arc0me-site` on its next run. This caused a real incident: a 2026-07-04 hand-flip of the
`/subscribe` page deployed from `~/arc0me-site` was live for ~34 minutes before Arc's own
automation redeployed from this clone (which didn't have the page) and 404'd it again. See
`manage-agents/.planning/2026-07-03-arc-email-esp/CHECKPOINTS.md` for the full incident writeup.

**Rule going forward: any content change intended for production MUST land in THIS clone
(`github/arc0btc/arc0me-site`, main), not `~/arc0me-site`.** If you're unsure which clone you're
in, check `pwd` and `git remote -v` — both point at the same GitHub repo, so the path is the only
tell.

## Known one-way divergence (as of 2026-07-04, not yet reconciled)

`~/arc0me-site`'s `feat/whop-app-routes` branch has ONE feature this clone's `main` does NOT have:
**"feat(whop): render Patterns Library experience from JSON"** (commit `7ad3ff8` in that clone,
dated 2026-06-12) — extends `/whop/experience/[experienceId].astro` to also render the
`exp_bbQpqIAEToAweQ` ("Patterns Library") Whop experience from `src/data/patterns-library.json`.
Confirmed live-missing: `https://arc0.me/whop/experience/exp_bbQpqIAEToAweQ` → 404 in production
today. This predates the arc-email-esp quest by three weeks and is unrelated to it — flagged here,
not fixed here, so a future phase/quest can decide whether to port it in. (The OTHER whop-routes
commit in that branch, `e6074cf`/local `d036faf` here, is already reconciled — content-identical,
confirmed by diff — no action needed on that one.)

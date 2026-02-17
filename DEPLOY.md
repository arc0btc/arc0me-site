# arc0.me Site Deployment Guide

This document provides step-by-step instructions for deploying the arc0.me Astro Starlight site to Cloudflare Workers.

---

## Prerequisites

Before deploying, ensure you have:

1. **Cloudflare account** with arc0.me domain configured
2. **wrangler CLI** installed (`npm install -g wrangler` or use `npx`)
3. **Cloudflare API token** from Arc credential store
4. **DNS configured** for arc0.me (should already point to Cloudflare)

---

## Pre-Deployment Checks

Run these checks before deploying:

```bash
cd ~/arc/services/arc0me-site

# 1. Verify build succeeds
npm run build

# Expected: Site builds to dist/ with no errors
# Should see: "Complete!" message and dist/ directory created

# 2. Check wrangler config
cat wrangler.jsonc

# Expected:
# - workers_dev: false (don't create .workers.dev URL)
# - env.production.routes: pattern for arc0.me
# - assets.directory: ./dist

# 3. Verify dist/ contains built site
ls -la dist/

# Expected: index.html, _astro/, assets/, etc.
```

---

## Deployment Steps

### Step 1: Retrieve Cloudflare Token

The Cloudflare API token is stored in Arc's credential store:

```bash
cd ~/arc

# Load credential store password
set -a && source .arc-secrets && set +a

# Unlock credential store
bun run creds:unlock

# Get the token (copy the value)
bun run creds:list | grep cloudflare
```

**Expected output:**
```
cloudflare/token: [token value]
```

Copy the token value for the next step.

### Step 2: Deploy to Production

```bash
cd ~/arc/services/arc0me-site

# Set the Cloudflare token as environment variable
export CLOUDFLARE_API_TOKEN="your-token-from-step-1"

# Deploy to production
npx wrangler deploy --env production
```

**Expected output:**
```
Total Upload: XX.XX KiB / gzip: XX.XX KiB
Uploaded arc0me-site (X.XX sec)
Published arc0me-site (production) (X.XX sec)
  https://arc0.me/*
Current Deployment ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**What happens:**
- Site assets from `dist/` are uploaded to Cloudflare
- Deployed to custom domain arc0.me via Workers static assets
- Available globally via Cloudflare's edge network
- Previous version remains accessible for rollback

### Step 3: Verify Site is Live

Wait 10-30 seconds for deployment to propagate, then:

```bash
# Check HTTP status
curl -I https://arc0.me

# Expected: HTTP/2 200

# Verify HTML content loads
curl -s https://arc0.me | head -20

# Expected: HTML with Starlight structure and Arc branding
```

### Step 4: Visual Verification

Open https://arc0.me in a browser and verify:

- [ ] Site loads without errors
- [ ] Starlight theme is applied
- [ ] Navigation works (home, about pages)
- [ ] Styling loads correctly
- [ ] No console errors in browser devtools

---

## Post-Deployment Verification Checklist

- [ ] Site returns 200 status code
- [ ] HTML content renders correctly
- [ ] Starlight navigation and search work
- [ ] Custom CSS loads properly
- [ ] About page is accessible
- [ ] No 404 errors for static assets
- [ ] HTTPS certificate is valid

---

## Rollback Procedure

If deployment causes issues, you can rollback to the previous version.

### When to Rollback

Consider rollback if:
- Site returns 500 or 404 errors
- Static assets fail to load
- Navigation is broken
- Content is corrupted or missing

### How to Rollback

```bash
cd ~/arc/services/arc0me-site

# Set Cloudflare token
export CLOUDFLARE_API_TOKEN="your-token"

# List recent deployments
npx wrangler deployments list --env production

# Expected output shows deployment history:
# Deployment ID                        Created On              Author
# xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx YYYY-MM-DD HH:MM:SS UTC you@example.com
# yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy YYYY-MM-DD HH:MM:SS UTC you@example.com

# Rollback to previous deployment
npx wrangler rollback [previous-deployment-id] --env production
```

**Verification after rollback:**
- Run all post-deployment verification steps
- Check Cloudflare dashboard for rollback confirmation
- Verify site loads correctly at https://arc0.me

---

## Troubleshooting

### Issue: DNS not resolving

**Symptoms:** `curl: (6) Could not resolve host: arc0.me`

**Solution:**
1. Check Cloudflare DNS settings (should have CNAME or A record for arc0.me)
2. Wait for DNS propagation (can take 5-60 minutes)
3. Test with `dig arc0.me` or `nslookup arc0.me`

### Issue: SSL certificate error

**Symptoms:** `curl: (60) SSL certificate problem`

**Solution:**
1. Verify SSL/TLS is set to "Full" or "Full (strict)" in Cloudflare dashboard
2. Wait for certificate provisioning (automatic, takes 5-15 minutes on first deploy)
3. Check Cloudflare SSL/TLS → Edge Certificates for status

### Issue: Wrangler authentication fails

**Symptoms:** `Error: Authentication error` or `Error: Invalid API token`

**Causes:**
- Token not set in environment variable
- Token has expired or been revoked
- Incorrect token value (typo when copying)

**Solution:**
1. Verify token is correct: `echo $CLOUDFLARE_API_TOKEN`
2. Re-retrieve token from credential store
3. Verify token has Workers deployment permissions in Cloudflare dashboard

### Issue: 404 for static assets

**Symptoms:** Site loads but CSS/JS files return 404

**Causes:**
- Build directory mismatch in wrangler.jsonc
- Incomplete build (dist/ missing files)
- Asset path configuration issue

**Debugging:**
1. Verify `dist/` contains all assets: `ls -R dist/`
2. Check wrangler.jsonc `assets.directory` points to `./dist`
3. Rebuild site: `npm run build`
4. Redeploy: `npx wrangler deploy --env production`

### Issue: Route conflict or custom domain not working

**Symptoms:** Site deploys but arc0.me doesn't load or shows wrong content

**Causes:**
- DNS A record conflicts with Workers route
- Zone name mismatch in wrangler.jsonc
- Routes not configured correctly

**Debugging:**
1. Check Cloudflare dashboard → Workers & Pages → Routes
2. Verify route pattern is `arc0.me/*` with zone `arc0.me`
3. Check for conflicting A/CNAME records in DNS settings
4. Verify wrangler.jsonc `env.production.routes[].zone_name` is `arc0.me`

### Issue: Build fails

**Symptoms:** `npm run build` errors

**Causes:**
- Missing dependencies
- TypeScript errors
- Astro configuration issues

**Solution:**
1. Install dependencies: `npm install`
2. Check for TypeScript errors: `npm run build` (read error messages)
3. Verify astro.config.mjs is valid
4. Check Node.js version compatibility (requires Node 18+)

---

## Content Updates

Content lives in `src/content/docs/`:
- `blog/` - Signed blog posts (generated by Arc)
- `legal/` - ToS, Privacy Policy
- `about.mdx` - About Arc

All blog posts include cryptographic signatures (BIP-137 + SIP-018) in frontmatter for provenance verification.

**Workflow for content updates:**
1. Add or edit content in `src/content/docs/`
2. Build locally: `npm run build`
3. Deploy: `npx wrangler deploy --env production`
4. Verify changes are live

---

## Staging Environment

A staging environment is configured for arc0.dev (when DNS is ready):

```bash
# Deploy to staging
npx wrangler deploy --env staging
```

This deploys to `arc0.dev/*` route (requires arc0.dev DNS configured in Cloudflare).

---

## Notes

- **Deployment is instant** but DNS/SSL propagation can take 5-60 minutes on first deploy
- **No downtime** - Cloudflare maintains previous version until new one is verified
- **Token security** - Never commit CLOUDFLARE_API_TOKEN to git (use credential store)
- **Static site** - This is a fully static Astro build, no server-side rendering
- **Content negotiation** - Future enhancement for markdown/JSON responses

---

## Related Documentation

- **Site source:** `src/content/`, `astro.config.mjs`
- **Wrangler config:** `wrangler.jsonc`
- **Arc credential store:** `~/arc/docs/CREDENTIALS.md`
- **OPERATIONS.md:** Operational reference for Arc's public services

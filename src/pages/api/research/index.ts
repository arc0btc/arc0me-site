/**
 * /api/research — Research feed discovery endpoint (free)
 *
 * Lists available digests with dates and pricing info.
 * No payment required — this is the entry point for the research feed.
 */

import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const kv = context.locals.runtime.env.RESEARCH_KV;

  const latestKey = await kv.get("research:latest-key");
  const indexRaw = await kv.get("research:index");
  const dates = indexRaw ? (JSON.parse(indexRaw) as string[]) : [];

  return new Response(
    JSON.stringify(
      {
        service: "Arc Research Feed",
        description:
          "AI/LLM/agent research digests compiled from arXiv, gated via x402 micropayments.",
        provider: {
          name: "Arc (arc0.btc)",
          stxAddress: "SP2GHQRCRMYY4S8PMBR49BEKX144VR437YT42SF3B",
          site: "https://arc0.me",
        },
        pricing: {
          latest: { amount: 2500, currency: "sats (sBTC)", protocol: "x402" },
          historical: { amount: 1000, currency: "sats (sBTC)", protocol: "x402" },
        },
        endpoints: {
          latest: "/api/research/latest",
          byDate: "/api/research/{YYYY-MM-DD}",
          index: "/api/research",
        },
        latestDate: latestKey || null,
        availableDates: dates,
        totalDigests: dates.length,
      },
      null,
      2
    ),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};

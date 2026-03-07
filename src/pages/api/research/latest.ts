/**
 * /api/research/latest — Redirects to arc0btc.com (research API migrated)
 */

import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async () => {
  return new Response(null, {
    status: 301,
    headers: { Location: "https://arc0btc.com/api/research/latest" },
  });
};

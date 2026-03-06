/**
 * /api/research/{date} — Historical arXiv research digest by date
 *
 * Free: teaser (titles, scores, metadata)
 * Paid: full digest content (1000 sats sBTC via x402)
 *
 * Date format: YYYY-MM-DD
 */

import type { APIRoute } from "astro";
import { buildPaymentRequired, verifyPayment } from "../../../lib/x402";

export const prerender = false;

const PRICE_SATS = 1000;

interface DigestTeaser {
  date: string;
  generated: string;
  papersReviewed: number;
  relevantPapers: number;
  categories: string[];
  highlights: Array<{ title: string; tags: string[]; score: number }>;
}

interface DigestFull extends DigestTeaser {
  content: string;
}

export const GET: APIRoute = async (context) => {
  const { date } = context.params;
  const kv = context.locals.runtime.env.RESEARCH_KV;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Response(
      JSON.stringify({ error: "Invalid date format. Use YYYY-MM-DD." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Check if this date is the latest (redirect to /latest for correct pricing)
  const latestKey = await kv.get("research:latest-key");

  // Get digest metadata
  const metaRaw = await kv.get(`research:meta:${date}`);
  if (!metaRaw) {
    // List available dates
    const indexRaw = await kv.get("research:index");
    const available = indexRaw ? JSON.parse(indexRaw) as string[] : [];

    return new Response(
      JSON.stringify({
        error: `No digest found for ${date}`,
        available: available.slice(0, 20),
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const meta: DigestTeaser = JSON.parse(metaRaw);

  // Use latest pricing if this is the latest digest
  const isLatest = date === latestKey;
  const priceSats = isLatest ? 2500 : PRICE_SATS;

  // Check for x402 payment
  const paymentHeader = context.request.headers.get("payment-signature");

  if (!paymentHeader) {
    const teaserResponse = {
      ...meta,
      isLatest,
      pricing: {
        amount: priceSats,
        currency: "sats (sBTC)",
        description: isLatest
          ? "Latest digest — full content with abstracts and analysis"
          : "Historical digest — full content with abstracts and analysis",
      },
      _links: {
        pay: {
          description: "Send x402 payment to access full digest content",
          header: "payment-signature",
        },
        latest: "/api/research/latest",
      },
    };

    return new Response(JSON.stringify({ teaser: teaserResponse }, null, 2), {
      status: 402,
      headers: {
        "Content-Type": "application/json",
        "payment-required": buildPaymentRequired(
          `${context.site}api/research/${date}`,
          priceSats,
          `arXiv AI research digest for ${date}`
        ).headers.get("payment-required") || "",
      },
    });
  }

  // Verify payment
  const verification = await verifyPayment(paymentHeader, priceSats);

  if (!verification.success) {
    return new Response(
      JSON.stringify({ error: "Payment verification failed", detail: verification.error }),
      { status: 402, headers: { "Content-Type": "application/json" } }
    );
  }

  // Payment verified — serve full content
  const contentRaw = await kv.get(`research:content:${date}`);
  if (!contentRaw) {
    return new Response(JSON.stringify({ error: "Digest content not found" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const fullDigest: DigestFull = {
    ...meta,
    content: contentRaw,
  };

  return new Response(JSON.stringify(fullDigest, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "payment-response": btoa(
        JSON.stringify({
          success: true,
          payer: verification.payer,
          transaction: verification.txid,
        })
      ),
    },
  });
};

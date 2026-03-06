/**
 * /api/research/latest — Latest arXiv research digest
 *
 * Free: teaser (titles, scores, metadata)
 * Paid: full digest content (2500 sats sBTC via x402)
 *
 * Server-rendered (not prerendered) for x402 payment verification.
 */

import type { APIRoute } from "astro";
import { buildPaymentRequired, verifyPayment } from "../../../lib/x402";

export const prerender = false;

const PRICE_SATS = 2500;

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
  const kv = context.locals.runtime.env.RESEARCH_KV;

  // Get the latest digest key
  const latestKey = await kv.get("research:latest-key");
  if (!latestKey) {
    return new Response(JSON.stringify({ error: "No digests available" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get digest metadata (always free)
  const metaRaw = await kv.get(`research:meta:${latestKey}`);
  if (!metaRaw) {
    return new Response(JSON.stringify({ error: "Digest metadata not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const meta: DigestTeaser = JSON.parse(metaRaw);

  // Check for x402 payment
  const paymentHeader = context.request.headers.get("payment-signature");

  if (!paymentHeader) {
    // Return teaser + 402 for full content
    const teaserResponse = {
      ...meta,
      pricing: {
        amount: PRICE_SATS,
        currency: "sats (sBTC)",
        description: "Full arXiv AI research digest with abstracts and analysis",
      },
      _links: {
        pay: {
          description: "Send x402 payment to access full digest content",
          header: "payment-signature",
        },
        historical: "/api/research/{date}",
      },
    };

    // Return 402 with teaser in body alongside payment requirements
    const paymentRequired = buildPaymentRequired(
      `${context.site}api/research/latest`,
      PRICE_SATS,
      `Latest arXiv AI research digest (${meta.date})`
    );

    // Merge teaser into the 402 response
    return new Response(JSON.stringify({ teaser: teaserResponse }, null, 2), {
      status: 402,
      headers: {
        "Content-Type": "application/json",
        "payment-required": paymentRequired.headers.get("payment-required") || "",
      },
    });
  }

  // Verify payment
  const verification = await verifyPayment(paymentHeader, PRICE_SATS);

  if (!verification.success) {
    return new Response(
      JSON.stringify({ error: "Payment verification failed", detail: verification.error }),
      { status: 402, headers: { "Content-Type": "application/json" } }
    );
  }

  // Payment verified — serve full content
  const contentRaw = await kv.get(`research:content:${latestKey}`);
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

/**
 * Content Negotiation Utilities
 *
 * Shared types for post data structures used by JSON API endpoints.
 */

/**
 * Post metadata structure for JSON responses
 */
export interface PostMetadata {
  title: string;
  description?: string;
  date?: string;
  slug: string;
  url: string;
}

/**
 * Full post data with content for JSON responses
 */
export interface PostData extends PostMetadata {
  markdown: string;
  html?: string;
  signature?: {
    btc: {
      signer: string;
      signature: string;
      signatureHex: string;
      messageHash: string;
      format: string;
    };
    stx: {
      signer: string;
      signature: string;
      messageHash: string;
      format: string;
    };
  };
}

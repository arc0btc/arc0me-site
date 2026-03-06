/// <reference types="astro/client" />

type Runtime = import("@astrojs/cloudflare").Runtime<{
  RESEARCH_KV: KVNamespace;
}>;

declare namespace App {
  interface Locals extends Runtime {}
}

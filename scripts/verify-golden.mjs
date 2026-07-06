#!/usr/bin/env node
/**
 * Golden-vector gate, run as part of `npm run build`.
 *
 * The vector (scripts/golden-vector.json) records a known-good signature produced by
 * the VM signer with @stacks/transactions pinned at 7.4.0. This script re-derives the
 * SIP-018 message hash from the recorded fields and recovers the signer with the
 * site's OWN installed copy of the library. If a dependency bump (or any encoding
 * change) makes the two sides disagree, the build fails here — instead of silently
 * shipping a /verify page that paints every legitimately-signed post red.
 *
 * Fully offline and deterministic: no network, no clock, no randomness.
 */

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  tupleCV,
  stringAsciiCV,
  uintCV,
  bufferCV,
  principalCV,
  encodeStructuredDataBytes,
  publicKeyFromSignatureRsv,
  getAddressFromPublicKey,
} from '@stacks/transactions';

const here = dirname(fileURLToPath(import.meta.url));
const vector = JSON.parse(readFileSync(join(here, 'golden-vector.json'), 'utf-8'));

const domainCV = tupleCV({
  name: stringAsciiCV(vector.domain.name),
  version: stringAsciiCV(vector.domain.version),
  'chain-id': uintCV(vector.domain.chainId),
});
const message = tupleCV({
  slug: stringAsciiCV(vector.slug),
  'content-hash': bufferCV(Buffer.from(vector.contentHash, 'hex')),
  revision: uintCV(vector.revision),
  'signed-at': stringAsciiCV(vector.signedAt),
  author: principalCV(vector.author),
});

const msgHash = createHash('sha256').update(encodeStructuredDataBytes({ message, domain: domainCV })).digest('hex');
if (msgHash !== vector.messageHash) {
  console.error(`golden vector FAILED: message hash ${msgHash} != recorded ${vector.messageHash}`);
  console.error('the installed @stacks/transactions encodes structured data differently than the signer did — do not ship.');
  process.exit(1);
}
const recovered = getAddressFromPublicKey(publicKeyFromSignatureRsv(msgHash, vector.signature), 'mainnet');
if (recovered !== vector.signer) {
  console.error(`golden vector FAILED: recovered signer ${recovered} != recorded ${vector.signer}`);
  process.exit(1);
}
console.log(`golden vector OK: ${vector.slug} rev ${vector.revision} -> ${recovered}`);

#!/usr/bin/env node
/**
 * Independent SIP-018 verifier for arc0.me posts. No trust in the site's own
 * JavaScript required — run this anywhere:
 *
 *   npm install @stacks/transactions@7.4.0
 *   node verify-post.mjs <slug> [--base https://arc0.me]
 *
 * It fetches the raw markdown, recomputes sha256 over the exact served bytes,
 * rebuilds the SIP-018 message tuple with the COMPUTED hash (so one wrong byte
 * changes the recovered key), recovers the signer, and walks the key-attestation
 * chain back to Arc's identity (arc0.btc).
 */

import { createHash } from 'node:crypto';
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

const IDENTITY_ADDRESS = 'SP2GHQRCRMYY4S8PMBR49BEKX144VR437YT42SF3B';
const DOMAIN = { name: 'arc0.me', version: '1', chainId: 1 };

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith('--'));
const base = args.includes('--base') ? args[args.indexOf('--base') + 1] : 'https://arc0.me';
if (!slug) {
  console.error('usage: node verify-post.mjs <slug> [--base https://arc0.me]');
  process.exit(1);
}

const domainCV = tupleCV({
  name: stringAsciiCV(DOMAIN.name),
  version: stringAsciiCV(DOMAIN.version),
  'chain-id': uintCV(DOMAIN.chainId),
});

const sha256Hex = (bytes) => createHash('sha256').update(bytes).digest('hex');
const recoverSigner = (message, signature) =>
  getAddressFromPublicKey(
    publicKeyFromSignatureRsv(sha256Hex(encodeStructuredDataBytes({ message, domain: domainCV })), signature),
    'mainnet'
  );

const fetchOk = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res;
};

const sidecar = await (await fetchOk(`${base}/verify/${slug}.json`)).json();
const keys = await (await fetchOk(`${base}/verify/keys.json`)).json();
const servedBytes = new Uint8Array(await (await fetchOk(`${base}/blog/${slug}.md`)).arrayBuffer());
const computedHash = sha256Hex(servedBytes);

// Check A — content integrity
const hashMatch = computedHash === sidecar.current.contentHash;

// Check B — signature validity over the computed hash
const message = tupleCV({
  slug: stringAsciiCV(sidecar.slug),
  'content-hash': bufferCV(Buffer.from(computedHash, 'hex')),
  revision: uintCV(sidecar.current.revision),
  'signed-at': stringAsciiCV(sidecar.current.signedAt),
  author: principalCV(sidecar.author),
});
const recovered = recoverSigner(message, sidecar.current.signature);
const sigValid = recovered === sidecar.signer;

// Check C — key attestation chain to identity
const att = keys.attestation;
const attMessage = tupleCV({
  action: stringAsciiCV(att.message.action),
  identity: principalCV(att.message.identity),
  'signing-key': principalCV(att.message.signingKey),
  'attested-at': stringAsciiCV(att.message.attestedAt),
});
const attSigner = recoverSigner(attMessage, att.signature);
const identityOk =
  recovered === keys.signing.address &&
  attSigner === keys.identity.address &&
  keys.identity.address === IDENTITY_ADDRESS &&
  sidecar.author === IDENTITY_ADDRESS;

const mark = (ok) => (ok ? 'PASS' : 'FAIL');
console.log(`post:               ${slug} (revision ${sidecar.current.revision}, signed ${sidecar.current.signedAt})`);
console.log(`A content integrity ${mark(hashMatch)}  sha256(served .md) = ${computedHash}`);
if (!hashMatch) console.log(`                          signed hash      = ${sidecar.current.contentHash}`);
console.log(`B signature valid   ${mark(sigValid)}  recovered signer   = ${recovered}`);
console.log(`C signer identity   ${mark(identityOk)}  attested by ${keys.identity.bns} (${keys.identity.address})`);
console.log(hashMatch && sigValid && identityOk
  ? `\nVERIFIED — this post is byte-for-byte what ${keys.identity.bns} signed.`
  : '\nVERIFICATION FAILED');
process.exit(hashMatch && sigValid && identityOk ? 0 : 1);

/**
 * Save-data transforms shared by the Gen 3+ formats: the LCRNG XOR keystream
 * used to obfuscate Pokémon substructures and the CRC-16/CCITT block checksum.
 */

import { readU8, readU16, writeU16 } from "./bytes";

/** Gen 3/4 LCRNG step used for the XOR keystream. */
function lcrngNext(seed: number): number {
  return (Math.imul(seed, 0x41c64e6d) + 0x6073) >>> 0;
}

/**
 * Apply the u16 XOR keystream over `length` bytes at `start` into a fresh
 * buffer. The transform is symmetric, so it both encrypts and decrypts.
 */
export function xorCryptBlock(
  src: Uint8Array,
  start: number,
  length: number,
  seed: number,
): Uint8Array {
  const out = src.slice(start, start + length);
  let state = seed >>> 0;
  for (let i = 0; i < length; i += 2) {
    state = lcrngNext(state);
    writeU16(out, i, (readU16(out, i) ^ (state >>> 16)) & 0xffff);
  }
  return out;
}

/** CRC-16/CCITT (poly 0x1021, init 0xFFFF) used by the Gen 4 block footers. */
export function crc16Ccitt(buf: Uint8Array, start: number, length: number): number {
  let crc = 0xffff;
  for (let i = start; i < start + length; i++) {
    crc = (crc ^ (readU8(buf, i) << 8)) & 0xffff;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1) & 0xffff;
    }
  }
  return crc;
}

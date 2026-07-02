/**
 * Little-endian byte access over plain `Uint8Array`, so save codecs stay free of
 * Node's `Buffer` and run unchanged in the browser.
 */

function view(buf: Uint8Array): DataView {
  return new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
}

export function readU8(buf: Uint8Array, offset: number): number {
  return buf[offset] ?? 0;
}

export function readU16(buf: Uint8Array, offset: number): number {
  return view(buf).getUint16(offset, true);
}

export function readU32(buf: Uint8Array, offset: number): number {
  return view(buf).getUint32(offset, true);
}

export function writeU8(buf: Uint8Array, offset: number, value: number): void {
  buf[offset] = value & 0xff;
}

export function writeU16(buf: Uint8Array, offset: number, value: number): void {
  view(buf).setUint16(offset, value & 0xffff, true);
}

export function writeU32(buf: Uint8Array, offset: number, value: number): void {
  view(buf).setUint32(offset, value >>> 0, true);
}

/** Copy `src[sourceStart, sourceEnd)` into `target` starting at `targetStart`. */
export function copyInto(
  target: Uint8Array,
  targetStart: number,
  src: Uint8Array,
  sourceStart = 0,
  sourceEnd = src.length,
): void {
  target.set(src.subarray(sourceStart, sourceEnd), targetStart);
}

import type { Gen4Game } from "./types";

/** Layout constants for a Gen 4 (DP/Pt/HGSS) save. */
const PARTY_CAPACITY = 6;
const SLOT_SIZE = 0xec; // 236 bytes: 0x88 boxed + 0x64 battle stats
const ENCRYPTED_BLOCK_OFFSET = 0x08;
const ENCRYPTED_BLOCK_SIZE = 0x80; // four 0x20 substructures
const BATTLE_BLOCK_OFFSET = 0x88;
const BATTLE_BLOCK_SIZE = 0x64;

const BOX_COUNT = 18;
const BOX_CAPACITY = 30;
const BOX_SLOT_SIZE = 0x88; // boxed Pokémon omit the 0x64 battle block

// Pt and HGSS are verified against real saves; DP follows the same layout but
// is not yet verified here.
const GEN4_GAMES: readonly Gen4Game[] = [
  { name: "DP", generalSize: 0xc100, partyOffset: 0x98, storageBase: 0xc100, storageSize: 0x121e4, boxOffset: 0x04, boxStride: 0xff0 },
  { name: "Pt", generalSize: 0xcf2c, partyOffset: 0xa0, storageBase: 0xcf2c, storageSize: 0x121e4, boxOffset: 0x04, boxStride: 0xff0 },
  { name: "HGSS", generalSize: 0xf628, partyOffset: 0x98, storageBase: 0xf700, storageSize: 0x12310, boxOffset: 0x00, boxStride: 0x1000 },
];

/** The 512 KiB save holds two interchangeable slots; the live one wins. */
const SLOT_BASES = [0x00000, 0x40000] as const;

/**
 * The 24 lexicographic permutations of the four substructures (A,B,C,D).
 * `order[storagePosition] = logicalBlockId`, selected by bits 13–17 of the PID.
 */
const BLOCK_ORDERS: readonly (readonly number[])[] = [
  [0, 1, 2, 3], [0, 1, 3, 2], [0, 2, 1, 3], [0, 2, 3, 1],
  [0, 3, 1, 2], [0, 3, 2, 1], [1, 0, 2, 3], [1, 0, 3, 2],
  [1, 2, 0, 3], [1, 2, 3, 0], [1, 3, 0, 2], [1, 3, 2, 0],
  [2, 0, 1, 3], [2, 0, 3, 1], [2, 1, 0, 3], [2, 1, 3, 0],
  [2, 3, 0, 1], [2, 3, 1, 0], [3, 0, 1, 2], [3, 0, 2, 1],
  [3, 1, 0, 2], [3, 1, 2, 0], [3, 2, 0, 1], [3, 2, 1, 0],
];

export {
    PARTY_CAPACITY,
    SLOT_SIZE,
    ENCRYPTED_BLOCK_OFFSET,
    ENCRYPTED_BLOCK_SIZE,
    BATTLE_BLOCK_OFFSET,
    BATTLE_BLOCK_SIZE,
    BOX_COUNT,
    BOX_CAPACITY,
    BOX_SLOT_SIZE,
    GEN4_GAMES,
    SLOT_BASES,
    BLOCK_ORDERS
}
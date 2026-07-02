import type {
  ContestStats,
  EffortValues,
  Gender,
  IndividualValues,
  MetInfo,
  Markings,
  MoveSlot,
  PartyPokemon,
  PokemonGen4,
  Stats,
  StatusCondition,
} from "../../pokemon/types";
import {
  BATTLE_BLOCK_OFFSET,
  BATTLE_BLOCK_SIZE,
  BLOCK_ORDERS,
  ENCRYPTED_BLOCK_OFFSET,
  ENCRYPTED_BLOCK_SIZE,
  SLOT_SIZE,
} from "./constants";
import { copyInto, readU8, readU16, readU32, writeU8, writeU16, writeU32 } from "../../utils/bytes";
import { xorCryptBlock } from "../../utils/crypto";
import { computeHiddenPower } from "../../utils/math";

/**
 * Decrypt and un-shuffle the 0x88-byte boxed structure shared by party and box
 * slots. Party slots carry an extra battle block past it, decrypted separately.
 */
function unshuffleBox(slot: Uint8Array): { box: Uint8Array; pid: number } | undefined {
  if (slot.length < 0x88) return undefined;
  const pid = readU32(slot, 0x00);
  const checksum = readU16(slot, 0x06);

  const encrypted = xorCryptBlock(slot, ENCRYPTED_BLOCK_OFFSET, ENCRYPTED_BLOCK_SIZE, checksum);
  const order = BLOCK_ORDERS[((pid >>> 13) & 0x1f) % 24];
  if (!order) return undefined;

  const box = new Uint8Array(0x88);
  copyInto(box, 0x00, slot, 0x00, ENCRYPTED_BLOCK_OFFSET); // plaintext header
  for (let logical = 0; logical < 4; logical++) {
    const pos = order.indexOf(logical);
    copyInto(box, ENCRYPTED_BLOCK_OFFSET + logical * 0x20, encrypted, pos * 0x20, pos * 0x20 + 0x20);
  }

  return { box, pid };
}

export function decodeBoxSlot(slot: Uint8Array): PokemonGen4 | undefined {
  const parts = unshuffleBox(slot);
  return parts ? decodeBoxPokemon(parts.box, parts.pid) : undefined;
}

export function decodePartySlot(slot: Uint8Array): PartyPokemon | undefined {
  const parts = unshuffleBox(slot);
  if (!parts || slot.length < SLOT_SIZE) return undefined;

  const base = decodeBoxPokemon(parts.box, parts.pid);
  if (!base) return undefined;

  const battle = xorCryptBlock(slot, BATTLE_BLOCK_OFFSET, BATTLE_BLOCK_SIZE, parts.pid);
  return {
    ...base,
    status: decodeStatus(readU8(battle, 0x00)),
    level: readU8(battle, 0x04),
    currentHp: readU16(battle, 0x06),
    stats: {
      hp: readU16(battle, 0x08),
      attack: readU16(battle, 0x0a),
      defense: readU16(battle, 0x0c),
      speed: readU16(battle, 0x0e),
      specialAttack: readU16(battle, 0x10),
      specialDefense: readU16(battle, 0x12),
    },
  };
}

function decodeBoxPokemon(box: Uint8Array, pid: number): PokemonGen4 | undefined {
  const speciesId = readU16(box, 0x08);
  if (speciesId === 0) return undefined; // empty slot

  const tid = readU16(box, 0x0c);
  const sid = readU16(box, 0x0e);
  const ivWord = readU32(box, 0x38);
  const ivs = unpackIvs(ivWord);
  const genderFlags = readU8(box, 0x40);
  const hiddenAbility = (readU8(box, 0x42) & 0x01) !== 0;
  const metByte = readU8(box, 0x84);

  const base: PokemonGen4 = {
    generation: 4,
    speciesId,
    nickname: decodeGen4Text(box, 0x48, 11),
    experience: readU32(box, 0x10),
    heldItemId: readU16(box, 0x0a),
    friendship: readU8(box, 0x14),
    pokerus: readU8(box, 0x82),
    ot: {
      name: decodeGen4Text(box, 0x68, 8),
      trainerId: tid,
      secretId: sid,
      gender: (metByte & 0x80) !== 0 ? "female" : "male",
    },
    personalityValue: pid,
    natureId: pid % 25, // Gen 4 always derives nature from the PID
    gender: decodeGender(genderFlags),
    isShiny: isShiny(pid, tid, sid),
    abilitySlot: hiddenAbility ? 2 : (pid & 1) === 1 ? 1 : 0,
    abilityId: readU8(box, 0x15),
    ivs,
    evs: readSixStats(box, 0x18),
    contest: readContest(box, 0x1e),
    moves: readMoves(box),
    met: {
      locationId: readU16(box, 0x80),
      levelMet: metByte & 0x7f,
      originGameId: readU8(box, 0x5f),
      ballId: readU8(box, 0x83),
    },
    hiddenPower: computeHiddenPower(ivs),
    ribbons: readU32(box, 0x24),
    markings: decodeMarkings(readU8(box, 0x16)),
    isEgg: (ivWord & 0x4000_0000) !== 0,
    isNicknamed: (ivWord & 0x8000_0000) !== 0,
    languageId: readU8(box, 0x17),
    formId: genderFlags >> 3,
  };

  const eggLocation = readU16(box, 0x7e);
  if (base.isEgg || eggLocation !== 0) {
    const eggMet: MetInfo = {
      locationId: eggLocation,
      levelMet: 0,
      originGameId: base.met.originGameId,
      ballId: 0,
    };
    base.eggMet = eggMet;
  }

  return base;
}

function readSixStats(buf: Uint8Array, offset: number): EffortValues {
  return {
    hp: readU8(buf, offset),
    attack: readU8(buf, offset + 1),
    defense: readU8(buf, offset + 2),
    speed: readU8(buf, offset + 3),
    specialAttack: readU8(buf, offset + 4),
    specialDefense: readU8(buf, offset + 5),
  };
}

function readContest(buf: Uint8Array, offset: number): ContestStats {
  return {
    coolness: readU8(buf, offset),
    beauty: readU8(buf, offset + 1),
    cuteness: readU8(buf, offset + 2),
    smartness: readU8(buf, offset + 3),
    toughness: readU8(buf, offset + 4),
    feel: readU8(buf, offset + 5),
  };
}

function readMoves(buf: Uint8Array): MoveSlot[] {
  const ppUps = readU8(buf, 0x34);
  const moves: MoveSlot[] = [];
  for (let i = 0; i < 4; i++) {
    const moveId = readU16(buf, 0x28 + i * 2);
    if (moveId === 0) continue;
    moves.push({
      moveId,
      pp: readU8(buf, 0x30 + i),
      ppUps: (ppUps >> (i * 2)) & 0x03,
    });
  }
  return moves;
}

function unpackIvs(word: number): IndividualValues {
  return {
    hp: word & 0x1f,
    attack: (word >>> 5) & 0x1f,
    defense: (word >>> 10) & 0x1f,
    speed: (word >>> 15) & 0x1f,
    specialAttack: (word >>> 20) & 0x1f,
    specialDefense: (word >>> 25) & 0x1f,
  };
}

function decodeGender(flags: number): Gender {
  if ((flags & 0x04) !== 0) return "genderless";
  if ((flags & 0x02) !== 0) return "female";
  return "male";
}

function isShiny(pid: number, tid: number, sid: number): boolean {
  const high = pid >>> 16;
  const low = pid & 0xffff;
  return (tid ^ sid ^ high ^ low) < 8;
}

function decodeMarkings(byte: number): Markings {
  return {
    circle: (byte & 0x01) !== 0,
    triangle: (byte & 0x02) !== 0,
    square: (byte & 0x04) !== 0,
    heart: (byte & 0x08) !== 0,
    star: (byte & 0x10) !== 0,
    diamond: (byte & 0x20) !== 0,
  };
}

function decodeStatus(byte: number): StatusCondition {
  return {
    sleepTurns: byte & 0x07,
    poison: (byte & 0x08) !== 0,
    burn: (byte & 0x10) !== 0,
    freeze: (byte & 0x20) !== 0,
    paralysis: (byte & 0x40) !== 0,
    badlyPoisoned: (byte & 0x80) !== 0,
  };
}

/**
 * Decode a Gen 4 in-game string (u16 units, 0xFFFF-terminated). Gen 4 uses a
 * proprietary character table; {@link GEN4_CHARMAP} covers the common Western
 * naming set and renders unknown units as '?'.
 */
function decodeGen4Text(buf: Uint8Array, offset: number, maxChars: number): string {
  let out = "";
  for (let i = 0; i < maxChars; i++) {
    const code = readU16(buf, offset + i * 2);
    if (code === 0xffff || code === 0x0000) break;
    out += GEN4_CHARMAP[code] ?? "?";
  }
  return out;
}

/**
 * Gen 4 Western character map (in-game 16-bit code -> character).
 *
 * The alphanumeric ranges are verified against real save data: A–Z begin at
 * 0x012B and a–z at 0x0145 (digits sit 12 codes below 'A' per the standard Gen 4
 * layout). Accented Latin letters and most symbols are NOT mapped yet — they
 * decode to '?'. Extend this table as those codes are confirmed.
 */
const GEN4_CHARMAP: Record<number, string> = buildGen4Charmap();

function buildGen4Charmap(): Record<number, string> {
  const map: Record<number, string> = {};
  for (let i = 0; i < 10; i++) map[0x011f + i] = String(i); // 0-9
  for (let i = 0; i < 26; i++) map[0x012b + i] = String.fromCharCode(0x41 + i); // A-Z
  for (let i = 0; i < 26; i++) map[0x0145 + i] = String.fromCharCode(0x61 + i); // a-z
  map[0x01be] = "-"; // inferred from observed names (e.g. "Shin-Chan")
  return map;
}

const GEN4_CHARMAP_INVERSE: Record<string, number> = Object.fromEntries(
  Object.entries(GEN4_CHARMAP).map(([code, char]) => [char, Number(code)]),
);

/**
 * Encrypt and shuffle a Gen 4 Pokémon into the 0x88-byte stored box slot — the
 * inverse of {@link decodeBoxSlot}. Fields absent from {@link PokemonGen4}
 * (alternate ribbon sets, dates, party battle stats) are written as zero.
 */
export function encodeBoxSlot(pokemon: PokemonGen4): Uint8Array {
  const pid = pokemon.personalityValue >>> 0;
  const box = new Uint8Array(0x88);
  writeU32(box, 0x00, pid);
  writeU16(box, 0x08, pokemon.speciesId);
  writeU16(box, 0x0a, pokemon.heldItemId ?? 0);
  writeU16(box, 0x0c, pokemon.ot.trainerId);
  writeU16(box, 0x0e, pokemon.ot.secretId);
  writeU32(box, 0x10, pokemon.experience >>> 0);
  writeU8(box, 0x14, pokemon.friendship ?? 0);
  writeU8(box, 0x15, pokemon.abilityId);
  writeU8(box, 0x16, encodeMarkings(pokemon.markings));
  writeU8(box, 0x17, pokemon.languageId);
  writeSixStats(box, 0x18, pokemon.evs);
  writeContest(box, 0x1e, pokemon.contest);
  writeU32(box, 0x24, pokemon.ribbons >>> 0);
  writeMoves(box, pokemon.moves);
  writeU32(box, 0x38, packIvs(pokemon.ivs, pokemon.isEgg, pokemon.isNicknamed));
  writeU8(box, 0x40, encodeGenderForm(pokemon.gender, pokemon.formId));
  writeU8(box, 0x42, pokemon.abilitySlot === 2 ? 1 : 0);
  encodeGen4Text(box, 0x48, 11, pokemon.nickname);
  writeU8(box, 0x5f, pokemon.met.originGameId);
  encodeGen4Text(box, 0x68, 8, pokemon.ot.name);
  writeU16(box, 0x7e, pokemon.eggMet?.locationId ?? 0);
  writeU16(box, 0x80, pokemon.met.locationId);
  writeU8(box, 0x82, pokemon.pokerus ?? 0);
  writeU8(box, 0x83, pokemon.met.ballId);
  writeU8(box, 0x84, (pokemon.met.levelMet & 0x7f) | (pokemon.ot.gender === "female" ? 0x80 : 0));

  let checksum = 0;
  for (let i = ENCRYPTED_BLOCK_OFFSET; i < 0x88; i += 2) {
    checksum = (checksum + readU16(box, i)) & 0xffff;
  }
  writeU16(box, 0x06, checksum);

  const order = BLOCK_ORDERS[((pid >>> 13) & 0x1f) % 24];
  if (!order) throw new Error("Invalid Gen 4 block order");

  const stored = new Uint8Array(0x88);
  copyInto(stored, 0x00, box, 0x00, ENCRYPTED_BLOCK_OFFSET);
  order.forEach((logical, pos) => {
    const from = ENCRYPTED_BLOCK_OFFSET + logical * 0x20;
    copyInto(stored, ENCRYPTED_BLOCK_OFFSET + pos * 0x20, box, from, from + 0x20);
  });

  copyInto(
    stored,
    ENCRYPTED_BLOCK_OFFSET,
    xorCryptBlock(stored, ENCRYPTED_BLOCK_OFFSET, ENCRYPTED_BLOCK_SIZE, checksum),
  );
  return stored;
}

/** Encode a Pokémon plus its party battle stats into a 0xEC-byte party slot. */
export function encodePartySlot(
  pokemon: PokemonGen4,
  battle: { status: StatusCondition; level: number; currentHp: number; stats: Stats },
): Uint8Array {
  const slot = new Uint8Array(SLOT_SIZE);
  copyInto(slot, 0x00, encodeBoxSlot(pokemon));

  const block = new Uint8Array(BATTLE_BLOCK_SIZE);
  writeU8(block, 0x00, encodeStatus(battle.status));
  writeU8(block, 0x04, battle.level);
  writeU16(block, 0x06, battle.currentHp);
  writeU16(block, 0x08, battle.stats.hp);
  writeU16(block, 0x0a, battle.stats.attack);
  writeU16(block, 0x0c, battle.stats.defense);
  writeU16(block, 0x0e, battle.stats.speed);
  writeU16(block, 0x10, battle.stats.specialAttack);
  writeU16(block, 0x12, battle.stats.specialDefense);

  copyInto(
    slot,
    BATTLE_BLOCK_OFFSET,
    xorCryptBlock(block, 0x00, BATTLE_BLOCK_SIZE, pokemon.personalityValue >>> 0),
  );
  return slot;
}

function encodeStatus(status: StatusCondition): number {
  return (
    (status.sleepTurns & 0x07) |
    (status.poison ? 0x08 : 0) |
    (status.burn ? 0x10 : 0) |
    (status.freeze ? 0x20 : 0) |
    (status.paralysis ? 0x40 : 0) |
    (status.badlyPoisoned ? 0x80 : 0)
  );
}

function writeSixStats(buf: Uint8Array, offset: number, stats: EffortValues): void {
  writeU8(buf, offset, stats.hp);
  writeU8(buf, offset + 1, stats.attack);
  writeU8(buf, offset + 2, stats.defense);
  writeU8(buf, offset + 3, stats.speed);
  writeU8(buf, offset + 4, stats.specialAttack);
  writeU8(buf, offset + 5, stats.specialDefense);
}

function writeContest(buf: Uint8Array, offset: number, contest: ContestStats): void {
  writeU8(buf, offset, contest.coolness);
  writeU8(buf, offset + 1, contest.beauty);
  writeU8(buf, offset + 2, contest.cuteness);
  writeU8(buf, offset + 3, contest.smartness);
  writeU8(buf, offset + 4, contest.toughness);
  writeU8(buf, offset + 5, contest.feel);
}

function writeMoves(buf: Uint8Array, moves: readonly MoveSlot[]): void {
  let ppUps = 0;
  for (let i = 0; i < 4; i++) {
    const move = moves[i];
    writeU16(buf, 0x28 + i * 2, move?.moveId ?? 0);
    writeU8(buf, 0x30 + i, move?.pp ?? 0);
    ppUps |= ((move?.ppUps ?? 0) & 0x03) << (i * 2);
  }
  writeU8(buf, 0x34, ppUps);
}

function packIvs(ivs: IndividualValues, isEgg: boolean, isNicknamed: boolean): number {
  let word =
    (ivs.hp & 0x1f) |
    ((ivs.attack & 0x1f) << 5) |
    ((ivs.defense & 0x1f) << 10) |
    ((ivs.speed & 0x1f) << 15) |
    ((ivs.specialAttack & 0x1f) << 20) |
    ((ivs.specialDefense & 0x1f) << 25);
  if (isEgg) word |= 0x4000_0000;
  if (isNicknamed) word |= 0x8000_0000;
  return word >>> 0;
}

function encodeMarkings(markings: Markings): number {
  return (
    (markings.circle ? 0x01 : 0) |
    (markings.triangle ? 0x02 : 0) |
    (markings.square ? 0x04 : 0) |
    (markings.heart ? 0x08 : 0) |
    (markings.star ? 0x10 : 0) |
    (markings.diamond ? 0x20 : 0)
  );
}

function encodeGenderForm(gender: Gender, formId: number): number {
  const genderBits = gender === "genderless" ? 0x04 : gender === "female" ? 0x02 : 0x00;
  return (genderBits | (formId << 3)) & 0xff;
}

/** Encode a string into the Gen 4 name field, terminating at the first unmappable character. */
function encodeGen4Text(buf: Uint8Array, offset: number, maxChars: number, text: string): void {
  let i = 0;
  for (; i < maxChars && i < text.length; i++) {
    const code = GEN4_CHARMAP_INVERSE[text[i] ?? ""];
    if (code === undefined) break;
    writeU16(buf, offset + i * 2, code);
  }
  for (; i < maxChars; i++) writeU16(buf, offset + i * 2, 0xffff);
}

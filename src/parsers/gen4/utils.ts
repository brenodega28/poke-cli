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

/** Gen 3/4 LCRNG step used for the XOR keystream. */
function lcrngNext(seed: number): number {
  return (Math.imul(seed, 0x41c64e6d) + 0x6073) >>> 0;
}

/**
 * Apply the u16 XOR keystream over `length` bytes at `start` into a fresh
 * buffer. The transform is symmetric, so it both encrypts and decrypts.
 */
function xorCryptBlock(src: Buffer, start: number, length: number, seed: number): Buffer {
  const out = Buffer.from(src.subarray(start, start + length));
  let state = seed >>> 0;
  for (let i = 0; i < length; i += 2) {
    state = lcrngNext(state);
    out.writeUInt16LE((out.readUInt16LE(i) ^ (state >>> 16)) & 0xffff, i);
  }
  return out;
}

/**
 * Decrypt and un-shuffle the 0x88-byte boxed structure shared by party and box
 * slots. Party slots carry an extra battle block past it, decrypted separately.
 */
function unshuffleBox(slot: Buffer): { box: Buffer; pid: number } | undefined {
  if (slot.length < 0x88) return undefined;
  const pid = slot.readUInt32LE(0x00);
  const checksum = slot.readUInt16LE(0x06);

  const encrypted = xorCryptBlock(slot, ENCRYPTED_BLOCK_OFFSET, ENCRYPTED_BLOCK_SIZE, checksum);
  const order = BLOCK_ORDERS[((pid >>> 13) & 0x1f) % 24];
  if (!order) return undefined;

  const box = Buffer.alloc(0x88);
  slot.copy(box, 0x00, 0x00, ENCRYPTED_BLOCK_OFFSET); // plaintext header
  for (let logical = 0; logical < 4; logical++) {
    const pos = order.indexOf(logical);
    encrypted.copy(box, ENCRYPTED_BLOCK_OFFSET + logical * 0x20, pos * 0x20, pos * 0x20 + 0x20);
  }

  return { box, pid };
}

export function decodeBoxSlot(slot: Buffer): PokemonGen4 | undefined {
  const parts = unshuffleBox(slot);
  return parts ? decodeBoxPokemon(parts.box, parts.pid) : undefined;
}

export function decodePartySlot(slot: Buffer): PartyPokemon | undefined {
  const parts = unshuffleBox(slot);
  if (!parts || slot.length < SLOT_SIZE) return undefined;

  const base = decodeBoxPokemon(parts.box, parts.pid);
  if (!base) return undefined;

  const battle = xorCryptBlock(slot, BATTLE_BLOCK_OFFSET, BATTLE_BLOCK_SIZE, parts.pid);
  return {
    ...base,
    status: decodeStatus(battle.readUInt8(0x00)),
    level: battle.readUInt8(0x04),
    currentHp: battle.readUInt16LE(0x06),
    stats: {
      hp: battle.readUInt16LE(0x08),
      attack: battle.readUInt16LE(0x0a),
      defense: battle.readUInt16LE(0x0c),
      speed: battle.readUInt16LE(0x0e),
      specialAttack: battle.readUInt16LE(0x10),
      specialDefense: battle.readUInt16LE(0x12),
    },
  };
}

function decodeBoxPokemon(box: Buffer, pid: number): PokemonGen4 | undefined {
  const speciesId = box.readUInt16LE(0x08);
  if (speciesId === 0) return undefined; // empty slot

  const tid = box.readUInt16LE(0x0c);
  const sid = box.readUInt16LE(0x0e);
  const ivWord = box.readUInt32LE(0x38);
  const ivs = unpackIvs(ivWord);
  const genderFlags = box.readUInt8(0x40);
  const hiddenAbility = (box.readUInt8(0x42) & 0x01) !== 0;
  const metByte = box.readUInt8(0x84);

  const base: PokemonGen4 = {
    generation: 4,
    speciesId,
    nickname: decodeGen4Text(box, 0x48, 11),
    experience: box.readUInt32LE(0x10),
    heldItemId: box.readUInt16LE(0x0a),
    friendship: box.readUInt8(0x14),
    pokerus: box.readUInt8(0x82),
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
    abilityId: box.readUInt8(0x15),
    ivs,
    evs: readSixStats(box, 0x18),
    contest: readContest(box, 0x1e),
    moves: readMoves(box),
    met: {
      locationId: box.readUInt16LE(0x80),
      levelMet: metByte & 0x7f,
      originGameId: box.readUInt8(0x5f),
      ballId: box.readUInt8(0x83),
    },
    hiddenPower: computeHiddenPower(ivs),
    ribbons: box.readUInt32LE(0x24),
    markings: decodeMarkings(box.readUInt8(0x16)),
    isEgg: (ivWord & 0x4000_0000) !== 0,
    isNicknamed: (ivWord & 0x8000_0000) !== 0,
    languageId: box.readUInt8(0x17),
    formId: genderFlags >> 3,
  };

  const eggLocation = box.readUInt16LE(0x7e);
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

function readSixStats(buf: Buffer, offset: number): EffortValues {
  return {
    hp: buf.readUInt8(offset),
    attack: buf.readUInt8(offset + 1),
    defense: buf.readUInt8(offset + 2),
    speed: buf.readUInt8(offset + 3),
    specialAttack: buf.readUInt8(offset + 4),
    specialDefense: buf.readUInt8(offset + 5),
  };
}

function readContest(buf: Buffer, offset: number): ContestStats {
  return {
    coolness: buf.readUInt8(offset),
    beauty: buf.readUInt8(offset + 1),
    cuteness: buf.readUInt8(offset + 2),
    smartness: buf.readUInt8(offset + 3),
    toughness: buf.readUInt8(offset + 4),
    feel: buf.readUInt8(offset + 5),
  };
}

function readMoves(buf: Buffer): MoveSlot[] {
  const ppUps = buf.readUInt8(0x34);
  const moves: MoveSlot[] = [];
  for (let i = 0; i < 4; i++) {
    const moveId = buf.readUInt16LE(0x28 + i * 2);
    if (moveId === 0) continue;
    moves.push({
      moveId,
      pp: buf.readUInt8(0x30 + i),
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

/** Hidden Power type (0–15) and power (30–70), derived from the IV low bits. */
function computeHiddenPower(ivs: IndividualValues): { typeId: number; power: number } {
  const order = [ivs.hp, ivs.attack, ivs.defense, ivs.speed, ivs.specialAttack, ivs.specialDefense];
  let typeSum = 0;
  let powerSum = 0;
  order.forEach((iv, i) => {
    typeSum += (iv & 1) << i;
    powerSum += ((iv >> 1) & 1) << i;
  });
  return {
    typeId: Math.floor((typeSum * 15) / 63),
    power: 30 + Math.floor((powerSum * 40) / 63),
  };
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
function decodeGen4Text(buf: Buffer, offset: number, maxChars: number): string {
  let out = "";
  for (let i = 0; i < maxChars; i++) {
    const code = buf.readUInt16LE(offset + i * 2);
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
export function encodeBoxSlot(pokemon: PokemonGen4): Buffer {
  const pid = pokemon.personalityValue >>> 0;
  const box = Buffer.alloc(0x88);
  box.writeUInt32LE(pid, 0x00);
  box.writeUInt16LE(pokemon.speciesId, 0x08);
  box.writeUInt16LE(pokemon.heldItemId ?? 0, 0x0a);
  box.writeUInt16LE(pokemon.ot.trainerId, 0x0c);
  box.writeUInt16LE(pokemon.ot.secretId, 0x0e);
  box.writeUInt32LE(pokemon.experience >>> 0, 0x10);
  box.writeUInt8(pokemon.friendship ?? 0, 0x14);
  box.writeUInt8(pokemon.abilityId, 0x15);
  box.writeUInt8(encodeMarkings(pokemon.markings), 0x16);
  box.writeUInt8(pokemon.languageId, 0x17);
  writeSixStats(box, 0x18, pokemon.evs);
  writeContest(box, 0x1e, pokemon.contest);
  box.writeUInt32LE(pokemon.ribbons >>> 0, 0x24);
  writeMoves(box, pokemon.moves);
  box.writeUInt32LE(packIvs(pokemon.ivs, pokemon.isEgg, pokemon.isNicknamed), 0x38);
  box.writeUInt8(encodeGenderForm(pokemon.gender, pokemon.formId), 0x40);
  box.writeUInt8(pokemon.abilitySlot === 2 ? 1 : 0, 0x42);
  encodeGen4Text(box, 0x48, 11, pokemon.nickname);
  box.writeUInt8(pokemon.met.originGameId, 0x5f);
  encodeGen4Text(box, 0x68, 8, pokemon.ot.name);
  box.writeUInt16LE(pokemon.eggMet?.locationId ?? 0, 0x7e);
  box.writeUInt16LE(pokemon.met.locationId, 0x80);
  box.writeUInt8(pokemon.pokerus ?? 0, 0x82);
  box.writeUInt8(pokemon.met.ballId, 0x83);
  box.writeUInt8((pokemon.met.levelMet & 0x7f) | (pokemon.ot.gender === "female" ? 0x80 : 0), 0x84);

  let checksum = 0;
  for (let i = ENCRYPTED_BLOCK_OFFSET; i < 0x88; i += 2) {
    checksum = (checksum + box.readUInt16LE(i)) & 0xffff;
  }
  box.writeUInt16LE(checksum, 0x06);

  const order = BLOCK_ORDERS[((pid >>> 13) & 0x1f) % 24];
  if (!order) throw new Error("Invalid Gen 4 block order");

  const stored = Buffer.alloc(0x88);
  box.copy(stored, 0x00, 0x00, ENCRYPTED_BLOCK_OFFSET);
  order.forEach((logical, pos) => {
    const from = ENCRYPTED_BLOCK_OFFSET + logical * 0x20;
    box.copy(stored, ENCRYPTED_BLOCK_OFFSET + pos * 0x20, from, from + 0x20);
  });

  xorCryptBlock(stored, ENCRYPTED_BLOCK_OFFSET, ENCRYPTED_BLOCK_SIZE, checksum).copy(
    stored,
    ENCRYPTED_BLOCK_OFFSET,
  );
  return stored;
}

/** Encode a Pokémon plus its party battle stats into a 0xEC-byte party slot. */
export function encodePartySlot(
  pokemon: PokemonGen4,
  battle: { status: StatusCondition; level: number; currentHp: number; stats: Stats },
): Buffer {
  const slot = Buffer.alloc(SLOT_SIZE);
  encodeBoxSlot(pokemon).copy(slot, 0x00);

  const block = Buffer.alloc(BATTLE_BLOCK_SIZE);
  block.writeUInt8(encodeStatus(battle.status), 0x00);
  block.writeUInt8(battle.level, 0x04);
  block.writeUInt16LE(battle.currentHp, 0x06);
  block.writeUInt16LE(battle.stats.hp, 0x08);
  block.writeUInt16LE(battle.stats.attack, 0x0a);
  block.writeUInt16LE(battle.stats.defense, 0x0c);
  block.writeUInt16LE(battle.stats.speed, 0x0e);
  block.writeUInt16LE(battle.stats.specialAttack, 0x10);
  block.writeUInt16LE(battle.stats.specialDefense, 0x12);

  xorCryptBlock(block, 0x00, BATTLE_BLOCK_SIZE, pokemon.personalityValue >>> 0).copy(
    slot,
    BATTLE_BLOCK_OFFSET,
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

/** CRC-16/CCITT (poly 0x1021, init 0xFFFF) used by the Gen 4 block footers. */
export function crc16Ccitt(buf: Buffer, start: number, length: number): number {
  let crc = 0xffff;
  for (let i = start; i < start + length; i++) {
    crc = (crc ^ (buf.readUInt8(i) << 8)) & 0xffff;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1) & 0xffff;
    }
  }
  return crc;
}

function writeSixStats(buf: Buffer, offset: number, stats: EffortValues): void {
  buf.writeUInt8(stats.hp, offset);
  buf.writeUInt8(stats.attack, offset + 1);
  buf.writeUInt8(stats.defense, offset + 2);
  buf.writeUInt8(stats.speed, offset + 3);
  buf.writeUInt8(stats.specialAttack, offset + 4);
  buf.writeUInt8(stats.specialDefense, offset + 5);
}

function writeContest(buf: Buffer, offset: number, contest: ContestStats): void {
  buf.writeUInt8(contest.coolness, offset);
  buf.writeUInt8(contest.beauty, offset + 1);
  buf.writeUInt8(contest.cuteness, offset + 2);
  buf.writeUInt8(contest.smartness, offset + 3);
  buf.writeUInt8(contest.toughness, offset + 4);
  buf.writeUInt8(contest.feel, offset + 5);
}

function writeMoves(buf: Buffer, moves: readonly MoveSlot[]): void {
  let ppUps = 0;
  for (let i = 0; i < 4; i++) {
    const move = moves[i];
    buf.writeUInt16LE(move?.moveId ?? 0, 0x28 + i * 2);
    buf.writeUInt8(move?.pp ?? 0, 0x30 + i);
    ppUps |= ((move?.ppUps ?? 0) & 0x03) << (i * 2);
  }
  buf.writeUInt8(ppUps, 0x34);
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
function encodeGen4Text(buf: Buffer, offset: number, maxChars: number, text: string): void {
  let i = 0;
  for (; i < maxChars && i < text.length; i++) {
    const code = GEN4_CHARMAP_INVERSE[text[i] ?? ""];
    if (code === undefined) break;
    buf.writeUInt16LE(code, offset + i * 2);
  }
  for (; i < maxChars; i++) buf.writeUInt16LE(0xffff, offset + i * 2);
}

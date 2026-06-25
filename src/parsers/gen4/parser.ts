import { readFileSync, writeFileSync } from "node:fs";

import { BaseParser } from "../base";
import type { PartyPokemon, Pokemon } from "../../pokemon/types";
import { clamp } from "../../utils/math";
import type { Gen4Game, Gen4ParserOptions } from "./types";
import {
  BOX_CAPACITY,
  BOX_COUNT,
  BOX_SLOT_SIZE,
  GEN4_GAMES,
  PARTY_CAPACITY,
  SLOT_BASES,
  SLOT_SIZE,
} from "./constants";
import { crc16Ccitt, decodeBoxSlot, decodePartySlot, encodeBoxSlot } from "./utils";

export class Gen4Parser extends BaseParser {
  private readonly forcedGame: Gen4Game["name"] | undefined;
  private readonly forcedSlot: 0 | 1 | undefined;

  constructor(saveFilePath: string, options: Gen4ParserOptions = {}) {
    super(saveFilePath);
    this.forcedGame = options.game;
    this.forcedSlot = options.slot;
  }

  readParty(): PartyPokemon[] {
    const save = readFileSync(this.saveFilePath);
    const game = this.resolveGame(save);
    const generalBase = this.resolveGeneralBase(save, game);
    const partyBase = generalBase + game.partyOffset;

    const count = clamp(save.readUInt32LE(partyBase - 4), 0, PARTY_CAPACITY);
    const party: PartyPokemon[] = [];

    for (let i = 0; i < count; i++) {
      const slot = save.subarray(partyBase + i * SLOT_SIZE, partyBase + (i + 1) * SLOT_SIZE);
      const mon = decodePartySlot(slot);
      if (mon) party.push(mon);
    }

    return party;
  }

  readBox(boxID: number): Pokemon[] {
    if (!Number.isInteger(boxID) || boxID < 0 || boxID >= BOX_COUNT) {
      throw new Error(`Box ${boxID} is out of range (0-${BOX_COUNT - 1})`);
    }

    const save = readFileSync(this.saveFilePath);
    const game = this.resolveGame(save);
    const partition = this.resolveStoragePartition(save, game);
    const boxBase = partition + game.storageBase + game.boxOffset + boxID * game.boxStride;

    const box: Pokemon[] = [];
    for (let i = 0; i < BOX_CAPACITY; i++) {
      const slot = save.subarray(boxBase + i * BOX_SLOT_SIZE, boxBase + (i + 1) * BOX_SLOT_SIZE);
      const mon = decodeBoxSlot(slot);
      if (mon) box.push(mon);
    }

    return box;
  }

  /** First empty slot in storage order, as `[boxID, slot]`. */
  getEmptyBoxSlot(): [number, number] {
    const save = readFileSync(this.saveFilePath);
    const game = this.resolveGame(save);
    const partition = this.resolveStoragePartition(save, game);

    for (let boxID = 0; boxID < BOX_COUNT; boxID++) {
      const boxBase = partition + game.storageBase + game.boxOffset + boxID * game.boxStride;
      for (let slot = 0; slot < BOX_CAPACITY; slot++) {
        const start = boxBase + slot * BOX_SLOT_SIZE;
        const buffer = save.subarray(start, start + BOX_SLOT_SIZE);
        if (!decodeBoxSlot(buffer)) return [boxID, slot];
      }
    }

    throw new Error("Storage is full: no empty box slot available");
  }

  /** Write `pokemon` into `[boxID, slot]` and save the result to `outFile`. */
  writePokemonToBoxSlot(pokemon: Pokemon, boxSlot: [number, number], outFile: string): void {
    if (pokemon.generation !== 4) {
      throw new Error(`Gen4Parser cannot write a generation ${pokemon.generation} Pokémon`);
    }
    const [boxID, slot] = boxSlot;
    if (!Number.isInteger(boxID) || boxID < 0 || boxID >= BOX_COUNT) {
      throw new Error(`Box ${boxID} is out of range (0-${BOX_COUNT - 1})`);
    }
    if (!Number.isInteger(slot) || slot < 0 || slot >= BOX_CAPACITY) {
      throw new Error(`Slot ${slot} is out of range (0-${BOX_CAPACITY - 1})`);
    }

    const save = readFileSync(this.saveFilePath);
    const game = this.resolveGame(save);
    const storageBase = this.resolveStoragePartition(save, game) + game.storageBase;
    const slotOffset = storageBase + game.boxOffset + boxID * game.boxStride + slot * BOX_SLOT_SIZE;

    encodeBoxSlot(pokemon).copy(save, slotOffset);
    const checksum = crc16Ccitt(save, storageBase, game.storageSize - game.storageFooterSize);
    save.writeUInt16LE(checksum, storageBase + game.storageSize - 2);

    writeFileSync(outFile, save);
  }

  /** Pick the game variant: explicit override, then footer size, then DP. */
  private resolveGame(save: Buffer): Gen4Game {
    const [defaultGame] = GEN4_GAMES;
    if (!defaultGame) throw new Error("No Gen 4 game definitions configured");

    if (this.forcedGame) {
      return GEN4_GAMES.find((g) => g.name === this.forcedGame) ?? defaultGame;
    }
    for (const base of SLOT_BASES) {
      for (const game of GEN4_GAMES) {
        // The general-block footer stores its own size at offset +0x08; the
        // footer itself sits at (generalSize - 0x14), so the size field is at
        // (generalSize - 0x0C). Use it to fingerprint the game.
        const sizeField = base + game.generalSize - 0x0c;
        if (sizeField + 4 <= save.length && save.readUInt32LE(sizeField) === game.generalSize) {
          return game;
        }
      }
    }
    return defaultGame;
  }

  /** Pick the live save slot via the footer save counter (higher wins). */
  private resolveGeneralBase(save: Buffer, game: Gen4Game): number {
    if (this.forcedSlot !== undefined) return SLOT_BASES[this.forcedSlot];

    const counterAt = (base: number): number => {
      // Save counter lives at footer+0x04, i.e. (generalSize - 0x10).
      const counter = base + game.generalSize - 0x10;
      return counter + 4 <= save.length ? save.readUInt32LE(counter) : 0;
    };

    return counterAt(SLOT_BASES[1]) > counterAt(SLOT_BASES[0]) ? SLOT_BASES[1] : SLOT_BASES[0];
  }

  /**
   * Pick the live storage partition. The storage block rotates independently
   * of the general block, so it has its own footer save counter.
   */
  private resolveStoragePartition(save: Buffer, game: Gen4Game): number {
    if (this.forcedSlot !== undefined) return SLOT_BASES[this.forcedSlot];

    const counterAt = (base: number): number => {
      const counter = base + game.storageBase + game.storageSize - 0x10;
      return counter + 4 <= save.length ? save.readUInt32LE(counter) : 0;
    };

    return counterAt(SLOT_BASES[1]) > counterAt(SLOT_BASES[0]) ? SLOT_BASES[1] : SLOT_BASES[0];
  }
}

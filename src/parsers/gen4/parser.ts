import { BaseParser, type EvolvePokemonArgs, type WritePokemonToBoxSlotArgs } from "../base";
import { fetchPokemonDataByID } from "../../pokemon/data";
import type { PartyPokemon, Pokemon, PokemonGen4 } from "../../pokemon/types";
import { clamp, computeStats } from "../../utils/math";
import type { Gen4Game, Gen4ParserOptions } from "./types";
import {
  BOX_CAPACITY,
  BOX_COUNT,
  BOX_SLOT_SIZE,
  GEN4_GAMES,
  GEN4_MAX_SPECIES,
  PARTY_CAPACITY,
  SLOT_BASES,
  SLOT_SIZE,
} from "./constants";
import { decodeBoxSlot, decodePartySlot, encodeBoxSlot, encodePartySlot } from "./utils";
import { copyInto, readU32, writeU16 } from "../../utils/bytes";
import { crc16Ccitt } from "../../utils/crypto";

export class Gen4Parser extends BaseParser {
  private readonly forcedGame: Gen4Game["name"] | undefined;
  private readonly forcedSlot: 0 | 1 | undefined;

  constructor(save: Uint8Array, options: Gen4ParserOptions = {}) {
    super(save);
    this.forcedGame = options.game;
    this.forcedSlot = options.slot;
  }

  /**
   * A fresh, independent copy of the save bytes — safe to read or mutate.
   * Uses the `Uint8Array` constructor rather than `.slice()` because a Node
   * `Buffer` (from `readFileSync`) overrides `slice` to return an aliasing view.
   */
  private cloneSave(): Uint8Array {
    return new Uint8Array(this.save);
  }

  readParty(): PartyPokemon[] {
    const save = this.cloneSave();
    const game = this.resolveGame(save);
    const generalBase = this.resolveGeneralBase(save, game);
    const partyBase = generalBase + game.partyOffset;

    const count = clamp(readU32(save, partyBase - 4), 0, PARTY_CAPACITY);
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

    const save = this.cloneSave();
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
    const save = this.cloneSave();
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

  /** Write `pokemon` into `[boxID, slot]` and return the updated save bytes. */
  writePokemonToBoxSlot({boxSlot, pokemon}: WritePokemonToBoxSlotArgs): Uint8Array {
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

    const save = this.cloneSave();
    const game = this.resolveGame(save);
    const storageBase = this.resolveStoragePartition(save, game) + game.storageBase;
    const slotOffset = storageBase + game.boxOffset + boxID * game.boxStride + slot * BOX_SLOT_SIZE;

    copyInto(save, slotOffset, encodeBoxSlot(pokemon));
    const checksum = crc16Ccitt(save, storageBase, game.storageSize - game.blockFooterSize);
    writeU16(save, storageBase + game.storageSize - 2, checksum);

    return save;
  }

  /** Evolve the Pokémon at `boxSlot` or `partySlot` and return the updated save bytes. */
  async evolvePokemon({ boxSlot, partySlot, speciesID }: EvolvePokemonArgs): Promise<Uint8Array> {
    if (boxSlot !== undefined && partySlot !== undefined) {
      throw new Error("evolvePokemon accepts either boxSlot or partySlot, not both");
    }

    const save = this.cloneSave();
    const game = this.resolveGame(save);

    if (partySlot !== undefined) return this.evolveParty(save, game, partySlot, speciesID);
    if (boxSlot !== undefined) return this.evolveBox(save, game, boxSlot, speciesID);
    throw new Error("evolvePokemon requires a boxSlot or partySlot");
  }

  /**
   * National Dex id to evolve into. With `requested`, validates it is one of the
   * species' Gen 4 evolutions; otherwise picks the first one.
   */
  private async resolveEvolution(speciesId: number, requested: number | undefined): Promise<number> {
    const species = await fetchPokemonDataByID(speciesId);
    const options = species.evolvesTo.filter((e) => e.toSpeciesId <= GEN4_MAX_SPECIES);

    if (requested !== undefined) {
      const match = options.find((e) => e.toSpeciesId === requested);
      if (!match) {
        throw new Error(`#${requested} is not a Gen 4 evolution of ${species.name} (#${speciesId})`);
      }
      return match.toSpeciesId;
    }

    const [evolution] = options;
    if (!evolution) throw new Error(`${species.name} (#${speciesId}) has no Gen 4 evolution`);
    return evolution.toSpeciesId;
  }

  private async evolveBox(
    save: Uint8Array,
    game: Gen4Game,
    [boxID, slot]: [number, number],
    requestedSpeciesId: number | undefined,
  ): Promise<Uint8Array> {
    if (!Number.isInteger(boxID) || boxID < 0 || boxID >= BOX_COUNT) {
      throw new Error(`Box ${boxID} is out of range (0-${BOX_COUNT - 1})`);
    }
    if (!Number.isInteger(slot) || slot < 0 || slot >= BOX_CAPACITY) {
      throw new Error(`Slot ${slot} is out of range (0-${BOX_CAPACITY - 1})`);
    }

    const storageBase = this.resolveStoragePartition(save, game) + game.storageBase;
    const slotOffset = storageBase + game.boxOffset + boxID * game.boxStride + slot * BOX_SLOT_SIZE;
    const current = decodeBoxSlot(save.subarray(slotOffset, slotOffset + BOX_SLOT_SIZE));
    if (!current) throw new Error(`Box ${boxID} slot ${slot} is empty`);

    const speciesId = await this.resolveEvolution(current.speciesId, requestedSpeciesId);
    copyInto(save, slotOffset, encodeBoxSlot({ ...current, speciesId }));
    writeU16(
      save,
      storageBase + game.storageSize - 2,
      crc16Ccitt(save, storageBase, game.storageSize - game.blockFooterSize),
    );
    return save;
  }

  private async evolveParty(
    save: Uint8Array,
    game: Gen4Game,
    partySlot: number,
    requestedSpeciesId: number | undefined,
  ): Promise<Uint8Array> {
    const generalBase = this.resolveGeneralBase(save, game);
    const partyBase = generalBase + game.partyOffset;
    const count = clamp(readU32(save, partyBase - 4), 0, PARTY_CAPACITY);
    if (!Number.isInteger(partySlot) || partySlot < 0 || partySlot >= count) {
      throw new Error(`Party slot ${partySlot} is empty`);
    }

    const slotOffset = partyBase + partySlot * SLOT_SIZE;
    const current = decodePartySlot(save.subarray(slotOffset, slotOffset + SLOT_SIZE));
    if (!current) throw new Error(`Party slot ${partySlot} is empty`);
    if (current.generation !== 4) {
      throw new Error(`Gen4Parser cannot evolve a generation ${current.generation} Pokémon`);
    }

    const speciesId = await this.resolveEvolution(current.speciesId, requestedSpeciesId);
    const species = await fetchPokemonDataByID(speciesId);
    const stats = computeStats(species.baseStats, current.ivs, current.evs, current.level, current.natureId);

    const evolved: PokemonGen4 = { ...current, speciesId };
    copyInto(save, slotOffset, encodePartySlot(evolved, {
      status: current.status,
      level: current.level,
      currentHp: stats.hp,
      stats,
    }));
    writeU16(
      save,
      generalBase + game.generalSize - 2,
      crc16Ccitt(save, generalBase, game.generalSize - game.blockFooterSize),
    );
    return save;
  }

  /** Pick the game variant: explicit override, then footer size, then DP. */
  private resolveGame(save: Uint8Array): Gen4Game {
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
        if (sizeField + 4 <= save.length && readU32(save, sizeField) === game.generalSize) {
          return game;
        }
      }
    }
    return defaultGame;
  }

  /** Pick the live save slot via the footer save counter (higher wins). */
  private resolveGeneralBase(save: Uint8Array, game: Gen4Game): number {
    if (this.forcedSlot !== undefined) return SLOT_BASES[this.forcedSlot];

    const counterAt = (base: number): number => {
      // Save counter lives at footer+0x04, i.e. (generalSize - 0x10).
      const counter = base + game.generalSize - 0x10;
      return counter + 4 <= save.length ? readU32(save, counter) : 0;
    };

    return counterAt(SLOT_BASES[1]) > counterAt(SLOT_BASES[0]) ? SLOT_BASES[1] : SLOT_BASES[0];
  }

  /**
   * Pick the live storage partition. The storage block rotates independently
   * of the general block, so it has its own footer save counter.
   */
  private resolveStoragePartition(save: Uint8Array, game: Gen4Game): number {
    if (this.forcedSlot !== undefined) return SLOT_BASES[this.forcedSlot];

    const counterAt = (base: number): number => {
      const counter = base + game.storageBase + game.storageSize - 0x10;
      return counter + 4 <= save.length ? readU32(save, counter) : 0;
    };

    return counterAt(SLOT_BASES[1]) > counterAt(SLOT_BASES[0]) ? SLOT_BASES[1] : SLOT_BASES[0];
  }
}
